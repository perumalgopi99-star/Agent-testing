// DOM Elements
const urlInput = document.getElementById('urlInput');
const aliasInput = document.getElementById('aliasInput');
const shortenBtn = document.getElementById('shortenBtn');
const errorMsg = document.getElementById('errorMsg');
const resultSection = document.getElementById('resultSection');
const resultShortUrl = document.getElementById('resultShortUrl');
const resultOriginalUrl = document.getElementById('resultOriginalUrl');
const resultCreatedAt = document.getElementById('resultCreatedAt');
const copyBtn = document.getElementById('copyBtn');
const statsSection = document.getElementById('statsSection');
const linksSection = document.getElementById('linksSection');
const linksTableBody = document.getElementById('linksTableBody');
const totalLinks = document.getElementById('totalLinks');
const totalClicks = document.getElementById('totalClicks');

// Event Listeners
shortenBtn.addEventListener('click', handleShorten);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleShorten();
});
copyBtn.addEventListener('click', handleCopy);

// Main Functions
async function handleShorten() {
  const url = urlInput.value.trim();
  const customAlias = aliasInput.value.trim();

  // Clear error
  hideError();

  // Validate URL
  if (!url) {
    showError('Please enter a URL');
    return;
  }

  if (!isValidUrl(url)) {
    showError('Please enter a valid URL (must start with http:// or https://)');
    return;
  }

  // Disable button
  shortenBtn.disabled = true;
  shortenBtn.textContent = 'Shortening...';

  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        customAlias: customAlias || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Failed to shorten URL');
      shortenBtn.disabled = false;
      shortenBtn.textContent = 'Shorten URL';
      return;
    }

    // Show result
    resultShortUrl.value = data.shortUrl;
    resultOriginalUrl.value = data.originalUrl;
    resultCreatedAt.value = new Date(data.createdAt).toLocaleString();
    resultSection.classList.remove('hidden');

    // Clear inputs
    urlInput.value = '';
    aliasInput.value = '';

    // Refresh links
    await refreshLinks();

    // Show success toast
    showToast('Link shortened successfully!');
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred. Please try again.');
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = 'Shorten URL';
  }
}

async function handleCopy() {
  const shortUrl = resultShortUrl.value;
  try {
    await navigator.clipboard.writeText(shortUrl);
    showToast('Copied to clipboard!');
  } catch (error) {
    console.error('Copy failed:', error);
    showError('Failed to copy to clipboard');
  }
}

async function refreshLinks() {
  try {
    const response = await fetch('/api/links');
    const links = await response.json();

    // Update stats
    const totalClicksCount = links.reduce((sum, link) => sum + link.clickCount, 0);
    totalLinks.textContent = links.length;
    totalClicks.textContent = totalClicksCount;

    // Show stats section if there are links
    if (links.length > 0) {
      statsSection.classList.remove('hidden');
      linksSection.classList.remove('hidden');
    }

    // Populate table
    linksTableBody.innerHTML = '';
    links.forEach((link) => {
      const row = document.createElement('tr');
      const createdDate = new Date(link.createdAt).toLocaleDateString();
      const createdTime = new Date(link.createdAt).toLocaleTimeString();
      const createdDateTime = `${createdDate} ${createdTime}`;

      const shortUrl = `${window.location.origin}/${link.shortCode}`;
      const truncatedOriginalUrl = truncateUrl(link.originalUrl, 50);

      row.innerHTML = `
        <td><span class="short-code">${escapeHtml(link.shortCode)}</span></td>
        <td>
          <span class="url-cell" title="${escapeHtml(link.originalUrl)}" onclick="openUrl('${escapeHtml(link.originalUrl)}')">
            ${escapeHtml(truncatedOriginalUrl)}
          </span>
        </td>
        <td><span class="click-count">${link.clickCount}</span></td>
        <td>${escapeHtml(createdDateTime)}</td>
        <td class="action-cell">
          <button class="btn btn-danger" onclick="deleteLink('${escapeHtml(link.shortCode)}')">Delete</button>
        </td>
      `;
      linksTableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching links:', error);
  }
}

async function deleteLink(shortCode) {
  if (!confirm('Are you sure you want to delete this link?')) {
    return;
  }

  try {
    const response = await fetch(`/api/links/${shortCode}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      showError('Failed to delete link');
      return;
    }

    showToast('Link deleted successfully!');
    await refreshLinks();
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred while deleting the link');
  }
}

function openUrl(url) {
  window.open(url, '_blank');
}

// Utility Functions
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.add('show');
}

function hideError() {
  errorMsg.classList.remove('show');
  errorMsg.textContent = '';
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  refreshLinks();
});
