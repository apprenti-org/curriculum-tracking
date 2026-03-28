/**
 * Authentication gate — shared across all pages
 * SHA-1 password check with session persistence
 */
(function() {
    const HASH = '46370cc0ad1ce253322c468038a362be0895cedb';

    function sha1(str) {
        const buf = new TextEncoder().encode(str);
        return crypto.subtle.digest('SHA-1', buf).then(h => {
            return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
        });
    }

    // Auto-authenticate if session exists
    if (sessionStorage.getItem('cms-auth') === HASH) {
        document.body.classList.add('authenticated');
    }

    function attempt() {
        const val = document.getElementById('auth-input').value;
        sha1(val).then(h => {
            if (h === HASH) {
                sessionStorage.setItem('cms-auth', HASH);
                document.body.classList.add('authenticated');
            } else {
                document.getElementById('auth-error').style.display = 'block';
                document.getElementById('auth-input').value = '';
                document.getElementById('auth-input').focus();
            }
        });
    }

    document.getElementById('auth-btn').addEventListener('click', attempt);
    document.getElementById('auth-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') attempt();
    });
})();
