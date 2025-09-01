// This file will contain the logic for the file explorer.

function openNav() {
  document.getElementById("file-explorer").style.width = "350px";
  loadExplorerData();
}

function closeNav() {
  document.getElementById("file-explorer").style.width = "0";
}

async function loadExplorerData() {
  try {
    const response = await fetch('/api/folders');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const folders = await response.json();
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = ''; // Clear existing list

    folders.forEach(folder => {
      const folderEl = document.createElement('div');
      folderEl.classList.add('folder');
      folderEl.dataset.folderId = folder.id;
      folderEl.innerHTML = `
        <div class="folder-header">
          <i class="fas fa-folder"></i>
          <span>${folder.name}</span>
          <div class="folder-actions">
            <i class="fas fa-plus" title="Add New Trace"></i>
            ${!folder.is_default ? `<i class="fas fa-edit" title="Rename Folder"></i>` : ''}
            ${!folder.is_default ? `<i class="fas fa-trash" title="Delete Folder"></i>` : ''}
          </div>
        </div>
      `;

      const traceList = document.createElement('ul');
      traceList.classList.add('trace-list');
      if (folder.Traces) {
        folder.Traces.forEach(trace => {
          const traceEl = document.createElement('li');
          traceEl.classList.add('trace-item');
          traceEl.dataset.traceId = trace.id;
          traceEl.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${trace.name}</span>
            <div class="trace-actions">
              <i class="fas fa-eye" title="View Trace"></i>
              <i class="fas fa-trash" title="Delete Trace"></i>
            </div>
          `;
          traceList.appendChild(traceEl);
        });
      }

      folderEl.appendChild(traceList);
      folderList.appendChild(folderEl);
    });
  } catch (error) {
    console.error('Error loading file explorer data:', error);
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = '<p>Error loading data. Please try again later.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById("open-explorer-btn");
    if (openBtn) {
        openBtn.addEventListener("click", openNav);
    }

    const closeBtn = document.getElementById("close-explorer-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeNav);
    }

    const addFolderBtn = document.getElementById("add-folder-btn");
    if (addFolderBtn) {
        addFolderBtn.addEventListener("click", async () => {
            const folderName = prompt("Enter the name for the new folder:");
            if (folderName) {
                try {
                    const response = await fetch('/api/folders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: folderName }),
                    });
                    if (response.ok) {
                        loadExplorerData();
                    } else {
                        const errorData = await response.json();
                        alert(`Error creating folder: ${errorData.error}`);
                    }
                } catch (error) {
                    console.error('Error creating folder:', error);
                    alert('An error occurred while creating the folder.');
                }
            }
        });
    }

    const folderList = document.getElementById('folder-list');
    if (folderList) {
        folderList.addEventListener('click', async (e) => {
            const target = e.target;
            const folderEl = target.closest('.folder');
            const traceEl = target.closest('.trace-item');

            if (folderEl && !traceEl) { // Action on folder, not on trace
                const folderId = folderEl.dataset.folderId;

                if (target.classList.contains('fa-edit')) {
                    const newName = prompt('Enter the new name for the folder:', folderEl.querySelector('.folder-header span').textContent);
                    if (newName) {
                        try {
                            const response = await fetch(`/api/folders/${folderId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: newName }),
                            });
                            if (response.ok) {
                                loadExplorerData();
                            } else {
                                const errorData = await response.json();
                                alert(`Error renaming folder: ${errorData.error}`);
                            }
                        } catch (error) {
                            console.error('Error renaming folder:', error);
                            alert('An error occurred while renaming the folder.');
                        }
                    }
                } else if (target.classList.contains('fa-trash') && target.closest('.folder-actions')) {
                    if (confirm('Are you sure you want to delete this folder? Traces inside will be moved to the default folder.')) {
                        try {
                            const response = await fetch(`/api/folders/${folderId}`, {
                                method: 'DELETE',
                            });
                            if (response.ok) {
                                loadExplorerData();
                            } else {
                                const errorData = await response.json();
                                alert(`Error deleting folder: ${errorData.error}`);
                            }
                        } catch (error) {
                            console.error('Error deleting folder:', error);
                            alert('An error occurred while deleting the folder.');
                        }
                    }
                }
            }

            if (traceEl) {
                const traceId = traceEl.dataset.traceId;

                if (target.classList.contains('fa-eye')) {
                    if (window.viewTrace) {
                        window.viewTrace(traceId);
                        closeNav();
                    } else {
                        console.error('viewTrace function not found on window object.');
                    }
                } else if (target.classList.contains('fa-trash') && target.closest('.trace-actions')) {
                    if (confirm('Are you sure you want to delete this trace?')) {
                        try {
                            const response = await fetch(`/api/traces/${traceId}`, {
                                method: 'DELETE',
                            });
                            if (response.ok) {
                                loadExplorerData();
                            } else {
                                const errorData = await response.json();
                                alert(`Error deleting trace: ${errorData.error}`);
                            }
                        } catch (error) {
                            console.error('Error deleting trace:', error);
                            alert('An error occurred while deleting the trace.');
                        }
                    }
                }
            }
        });
    }
});
