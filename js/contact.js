document.addEventListener('DOMContentLoaded', function() {
	// Simple toast system
	function ensureToastContainer(position = 'right') {
		const wantLeft = position === 'left';
		const selector = wantLeft ? '.toast-container.left' : '.toast-container:not(.left)';
		let container = document.querySelector(selector);
		if (!container) {
			container = document.createElement('div');
			container.className = 'toast-container' + (wantLeft ? ' left' : '');
			document.body.appendChild(container);
		}
		return container;
	}

	function showToast(message, type = 'info', ms = 5000, position = 'right') {
		const container = ensureToastContainer(position);
		const toast = document.createElement('div');
		toast.className = `toast ${type}` + (position === 'left' ? ' from-left' : '');
		toast.textContent = message;
		container.appendChild(toast);
		const hide = () => {
			toast.classList.add('hide');
			setTimeout(() => { toast.remove(); }, 380);
		};
		const timer = setTimeout(hide, ms);
		toast.addEventListener('click', () => { clearTimeout(timer); hide(); });
		return hide;
	}
	(function handleConnectFormSubmission() {
		const formEl = document.querySelector('.connect form');
		if (!formEl) return;

		function readAllSubmissions() {
			try {
				return JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
			} catch (e) {
				console.warn('[contact] failed to parse stored submissions:', e);
				return [];
			}
		}

		function writeAllSubmissions(list) {
			try {
				localStorage.setItem('contactSubmissions', JSON.stringify(list));
			} catch (e) {
				console.warn('[contact] failed to persist submissions:', e);
			}
		}

		// File System Access API (Chromium/Edge) — write directly to a user-picked
		// my-craftfolio/contact/contact-info.json once permission is granted.
		let contactFileHandle = null;
		async function ensureContactFileHandle() {
			if (!('showDirectoryPicker' in window)) return null;
			if (contactFileHandle) return contactFileHandle;
			try {
				const projectDir = await window.showDirectoryPicker();
				// Attempt to locate/create `contact` directory inside picked folder
				const contactDir = await projectDir.getDirectoryHandle('contact', { create: true });
				const fileHandle = await contactDir.getFileHandle('contact-info.json', { create: true });
				contactFileHandle = fileHandle;
				// Seed local cache from file (merge if valid array)
				try {
					const file = await fileHandle.getFile();
					const text = await file.text();
					const fromDisk = JSON.parse(text || '[]');
					if (Array.isArray(fromDisk)) {
						writeAllSubmissions(fromDisk);
					}
				} catch {}
				return contactFileHandle;
			} catch (e) {
				console.warn('[contact] directory/file pick canceled or failed:', e);
				return null;
			}
		}

		async function saveWithFileSystemAccess(all) {
			if (!('showDirectoryPicker' in window)) return false;
			try {
				const fileHandle = await ensureContactFileHandle();
				if (!fileHandle) return false;
				const perm = await fileHandle.requestPermission({ mode: 'readwrite' });
				if (perm !== 'granted') return false;
				const writable = await fileHandle.createWritable();
				await writable.write(JSON.stringify(all, null, 2));
				await writable.close();
				return true;
			} catch (e) {
				console.warn('[contact] File System Access save failed:', e);
				return false;
			}
		}

		function downloadAllAsJson(list) {
			try {
				const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
				const filename = 'contact-info.json';
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
			} catch (e) {
				console.warn('[contact] JSON download (all) failed:', e);
			}
		}

		formEl.addEventListener('submit', async function(event) {
			event.preventDefault();

			// Validate required fields and show left-bottom toast if missing
			const nameEl = formEl.querySelector('#name');
			const emailEl = formEl.querySelector('#email');
			const companyEl = formEl.querySelector('#company');
			const messageEl = formEl.querySelector('#message');
			const missing = [];
			if (!nameEl?.value?.trim()) missing.push('name');
			if (!emailEl?.value?.trim()) missing.push('email');
			if (!companyEl?.value?.trim()) missing.push('company');
			if (!messageEl?.value?.trim()) missing.push('message');
			if (missing.length) {
				showToast('Please fill in: ' + missing.join(', '), 'error', 5000, 'right');
				return;
			}

			const submission = {
				name: nameEl.value.trim(),
				email: emailEl.value.trim(),
				company: companyEl.value.trim(),
				message: messageEl.value.trim(),
				submittedAt: new Date().toISOString(),
				userAgent: navigator.userAgent
			};

			// 1) Try backend API if available
			try {
				const res = await fetch('/api/contact', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(submission)
				});
				if (res && res.ok) {
					formEl.reset();
					showToast('Successfully sent message!', 'success');
					return;
				}
			} catch (_) {}

			// 2) Prefer File System Access API (no server). One-time directory pick required per session.
			const all = readAllSubmissions();
			all.push(submission);
			writeAllSubmissions(all);
			const saved = await saveWithFileSystemAccess(all);
			if (saved) {
				formEl.reset();
				showToast('Successfully sent message!', 'success');
				return;
			}

			// 3) Fallback: download the JSON so you can place it into contact/contact-info.json
			downloadAllAsJson(all);
			formEl.reset();
			showToast('Saved locally and downloaded contact-info.json. Run the server or grant folder access for direct writes.', 'info');
		});
	})();
});


