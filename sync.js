/**
 * SpendWise Google Drive Sync
 *
 * SETUP: Replace CLIENT_ID below with your Google Cloud OAuth 2.0 Client ID.
 *
 * 1. Go to https://console.cloud.google.com
 * 2. Create a project (or select existing)
 * 3. Enable "Google Drive API"
 * 4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
 * 5. Application type: Web application
 * 6. Authorized JavaScript origins: https://yourusername.github.io
 *    (also add http://localhost:8000 for local testing)
 * 7. Copy the Client ID and paste it below
 */

// ===== REPLACE THIS WITH YOUR CLIENT ID =====
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
// =============================================

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

const DriveSync = {
  tokenClient: null,
  isSignedIn: false,
  isSyncing: false,
  userName: '',

  // ---- Init ----
  async initialize() {
    if (CLIENT_ID.includes('1007692059807-t42t1nn91kchdrpniv133cbrf2qgha6b.apps.googleusercontent.com')) {
      console.log('DriveSync: No Client ID configured — sync disabled');
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        if (typeof gapi === 'undefined') { reject('gapi not loaded'); return; }
        gapi.load('client', { callback: resolve, onerror: reject });
      });
      await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // set dynamically
      });

      // Check for existing token
      const savedToken = localStorage.getItem('spendwise_gtoken');
      if (savedToken) {
        try {
          const parsed = JSON.parse(savedToken);
          gapi.client.setToken(parsed);
          this.isSignedIn = true;
          this.userName = localStorage.getItem('spendwise_guser') || 'Synced';
          this._updateUI();
        } catch (e) {
          localStorage.removeItem('spendwise_gtoken');
        }
      }

      console.log('DriveSync: Initialized');
    } catch (err) {
      console.error('DriveSync: Init failed', err);
    }
  },

  // ---- Auth ----
  signIn() {
    if (!this.tokenClient) {
      if (typeof showToast === 'function') showToast('Sync not configured — see sync.js');
      return;
    }

    this.tokenClient.callback = async (response) => {
      if (response.error) {
        console.error('Auth error:', response);
        return;
      }
      this.isSignedIn = true;

      // Save token
      localStorage.setItem('spendwise_gtoken', JSON.stringify(gapi.client.getToken()));

      // Get user info
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: 'Bearer ' + gapi.client.getToken().access_token },
        });
        const info = await res.json();
        this.userName = info.name || info.email || 'Synced';
        localStorage.setItem('spendwise_guser', this.userName);
      } catch (e) {
        this.userName = 'Synced';
      }

      this._updateUI();
      if (typeof showToast === 'function') showToast('Signed in as ' + this.userName);
      if (typeof setStatus === 'function') setStatus('SYNC → Connected to Google Drive');

      // Initial sync
      await this.pull();
    };

    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  },

  signOut() {
    const token = gapi.client.getToken();
    if (token) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken(null);
    }
    this.isSignedIn = false;
    this.userName = '';
    localStorage.removeItem('spendwise_gtoken');
    localStorage.removeItem('spendwise_guser');
    this._updateUI();
    if (typeof showToast === 'function') showToast('Signed out');
    if (typeof setStatus === 'function') setStatus('SYNC → Disconnected');
  },

  // ---- File Operations ----
  async _findFile(name) {
    try {
      const res = await gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        q: "name = '" + name + "'",
        fields: 'files(id, name, modifiedTime)',
        pageSize: 1,
      });
      return res.result.files && res.result.files.length > 0 ? res.result.files[0] : null;
    } catch (err) {
      if (err.status === 401) {
        this._handleAuthExpired();
      }
      throw err;
    }
  },

  async _readFile(fileId) {
    const res = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
  },

  async _writeFile(name, data) {
    const existing = await this._findFile(name);
    const content = JSON.stringify(data);
    const boundary = '---spendwise---';
    const metadata = {
      name: name,
      mimeType: 'application/json',
    };

    if (!existing) {
      metadata.parents = ['appDataFolder'];
    }

    const body =
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: application/json\r\n\r\n' +
      content + '\r\n' +
      '--' + boundary + '--';

    const url = existing
      ? 'https://www.googleapis.com/upload/drive/v3/files/' + existing.id + '?uploadType=multipart'
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const method = existing ? 'PATCH' : 'POST';

    await fetch(url, {
      method: method,
      headers: {
        Authorization: 'Bearer ' + gapi.client.getToken().access_token,
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: body,
    });
  },

  // ---- Sync Logic ----
  async push() {
    if (!this.isSignedIn || this.isSyncing) return;
    this.isSyncing = true;
    this._setStatus('syncing');

    try {
      const txns = JSON.parse(localStorage.getItem('spendwise_transactions') || '[]');
      const recurring = JSON.parse(localStorage.getItem('spendwise_recurring') || '[]');

      await this._writeFile('transactions.json', txns);
      await this._writeFile('recurring.json', recurring);

      localStorage.setItem('spendwise_last_sync', new Date().toISOString());
      this._setStatus('synced');
      if (typeof setStatus === 'function') setStatus('SYNC → Pushed to Google Drive');
    } catch (err) {
      console.error('Push failed:', err);
      this._setStatus('error');
      if (err.status === 401) this._handleAuthExpired();
    }

    this.isSyncing = false;
  },

  async pull() {
    if (!this.isSignedIn || this.isSyncing) return;
    this.isSyncing = true;
    this._setStatus('syncing');

    try {
      // Pull transactions
      const txnFile = await this._findFile('transactions.json');
      if (txnFile) {
        const cloudTxns = await this._readFile(txnFile.id);
        const localTxns = JSON.parse(localStorage.getItem('spendwise_transactions') || '[]');
        const merged = this._mergeById(localTxns, cloudTxns);
        localStorage.setItem('spendwise_transactions', JSON.stringify(merged));
      }

      // Pull recurring
      const recFile = await this._findFile('recurring.json');
      if (recFile) {
        const cloudRec = await this._readFile(recFile.id);
        const localRec = JSON.parse(localStorage.getItem('spendwise_recurring') || '[]');
        const merged = this._mergeById(localRec, cloudRec);
        localStorage.setItem('spendwise_recurring', JSON.stringify(merged));
      }

      localStorage.setItem('spendwise_last_sync', new Date().toISOString());
      this._setStatus('synced');

      // Push merged data back to cloud
      await this.push();

      // Reload app state
      if (typeof reloadFromStorage === 'function') reloadFromStorage();
      if (typeof setStatus === 'function') setStatus('SYNC → Synced with Google Drive');
    } catch (err) {
      console.error('Pull failed:', err);
      this._setStatus('error');
      if (err.status === 401) this._handleAuthExpired();
    }

    this.isSyncing = false;
  },

  _mergeById(local, cloud) {
    const map = new Map();
    // Cloud first, then local overwrites
    cloud.forEach(item => { if (item.id) map.set(item.id, item); });
    local.forEach(item => { if (item.id) map.set(item.id, item); });
    return Array.from(map.values());
  },

  // ---- Debounced push ----
  _pushTimer: null,
  schedulePush() {
    if (!this.isSignedIn) return;
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => this.push(), 2000);
  },

  // ---- UI ----
  _updateUI() {
    const label = document.getElementById('syncLabel');
    const icon = document.getElementById('syncIcon');
    if (this.isSignedIn) {
      label.textContent = this.userName.split(' ')[0].toUpperCase();
      icon.textContent = '●';
      icon.style.color = 'var(--green)';
    } else {
      label.textContent = 'SIGN IN';
      icon.textContent = '◯';
      icon.style.color = '';
    }
  },

  _setStatus(state) {
    const el = document.getElementById('syncStatus');
    switch (state) {
      case 'syncing': el.textContent = 'syncing...'; el.style.color = 'var(--yellow)'; break;
      case 'synced': el.textContent = 'synced'; el.style.color = 'var(--green)'; break;
      case 'error': el.textContent = 'sync error'; el.style.color = 'var(--red)'; break;
      default: el.textContent = ''; break;
    }
  },

  _handleAuthExpired() {
    this.isSignedIn = false;
    localStorage.removeItem('spendwise_gtoken');
    this._updateUI();
    if (typeof showToast === 'function') showToast('Session expired — sign in again');
  },
};
