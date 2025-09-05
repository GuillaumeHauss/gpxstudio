// This file will contain the logic for the file explorer.

const backendUrl = '';
let activeFolderId = null;

function setActiveFolder(folderId) {
    activeFolderId = folderId;
    loadExplorerData();
}

function openNav() {
  document.getElementById("file-explorer").style.width = "350px";
  loadExplorerData();
}

function closeNav() {
  document.getElementById("file-explorer").style.width = "0";
}

async function loadExplorerData() {
  try {
    const response = await fetch(`${backendUrl}/api/folders`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const folders = await response.json();
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = ''; // Clear existing list

    folders.forEach(folder => {
      if (folder.is_default && activeFolderId === null) {
        activeFolderId = folder.id;
      }
      const folderEl = document.createElement('div');
      folderEl.classList.add('folder');
      if (folder.id === activeFolderId) {
        folderEl.classList.add('active');
      }
      folderEl.dataset.folderId = folder.id;
      folderEl.innerHTML = `
        <div class="folder-header">
          <i class="fas fa-folder folder-toggle"></i>
          <span class="folder-toggle">${folder.name}</span>
          ${folder.id === activeFolderId ? '<i class="fas fa-star active-folder-icon" title="Active Folder"></i>' : ''}
          <div class="folder-actions">
            <i class="fas fa-plus" title="Add New Trace"></i>
            <i class="fas fa-file-archive download-folder" title="Download All Traces"></i>
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
    openNav(); // Open the file explorer by default

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
            const folderName = await customPrompt("Enter the name for the new folder:");
            if (folderName) {
                try {
                    const response = await fetch(`${backendUrl}/api/folders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: folderName }),
                    });
                    if (response.ok) {
                        loadExplorerData();
                        showNotification('Folder created successfully.', 'success');
                    } else {
                        const errorData = await response.json();
                        showNotification(`Error creating folder: ${errorData.error}`, 'error');
                    }
                } catch (error) {
                    console.error('Error creating folder:', error);
                    showNotification('An error occurred while creating the folder.', 'error');
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

            if (folderEl && !traceEl) {
                const folderId = folderEl.dataset.folderId;

                if (target.classList.contains('folder-toggle')) {
                    folderEl.classList.toggle('open');
                } else {
                    setActiveFolder(folderId);
                }

                if (target.classList.contains('download-folder')) {
                    downloadFolderAsZip(folderId, folderEl.querySelector('span.folder-toggle').textContent);
                } else if (target.classList.contains('fa-edit')) {
                    const newName = await customPrompt('Enter the new name for the folder:', folderEl.querySelector('.folder-header span').textContent);
                    if (newName) {
                        try {
                            const response = await fetch(`${backendUrl}/api/folders/${folderId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: newName }),
                            });
                            if (response.ok) {
                                loadExplorerData();
                                showNotification('Folder renamed successfully.', 'success');
                            } else {
                                const errorData = await response.json();
                                showNotification(`Error renaming folder: ${errorData.error}`, 'error');
                            }
                        } catch (error) {
                            console.error('Error renaming folder:', error);
                            showNotification('An error occurred while renaming the folder.', 'error');
                        }
                    }
                } else if (target.classList.contains('fa-trash') && target.closest('.folder-actions')) {
                    if (await customConfirm('Are you sure you want to delete this folder? Traces inside will be moved to the default folder.')) {
                        try {
                            const response = await fetch(`${backendUrl}/api/folders/${folderId}`, {
                                method: 'DELETE',
                            });
                            if (response.ok) {
                                loadExplorerData();
                                showNotification('Folder deleted successfully.', 'success');
                            } else {
                                const errorData = await response.json();
                                showNotification(`Error deleting folder: ${errorData.error}`, 'error');
                            }
                        } catch (error) {
                            console.error('Error deleting folder:', error);
                            showNotification('An error occurred while deleting the folder.', 'error');
                        }
                    }
                } else if (target.classList.contains('fa-plus')) {
                    if (window.saveTrace) {
                        if (window.total && window.total.focusOn !== null && window.total.traces[window.total.focusOn]) {
                            const trace = window.total.traces[window.total.focusOn];
                            window.saveTrace(trace, folderId);
                        } else {
                            showNotification('There is no active trace to save.', 'error');
                        }
                    } else {
                        console.error('saveTrace function not found on window object.');
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
                    if (await customConfirm('Are you sure you want to delete this trace?')) {
                        try {
                            const response = await fetch(`${backendUrl}/api/traces/${traceId}`, {
                                method: 'DELETE',
                            });
                            if (response.ok) {
                                loadExplorerData();
                                showNotification('Trace deleted successfully.', 'success');
                            } else {
                                const errorData = await response.json();
                                showNotification(`Error deleting trace: ${errorData.error}`, 'error');
                            }
                        } catch (error) {
                            console.error('Error deleting trace:', error);
                            showNotification('An error occurred while deleting the trace.', 'error');
                        }
                    }
                }
            }
        });
    }
});

function encodeString(value) {
    if (!value) return '';
    return value.toString().replaceAll(/&/g, '&amp;')
        .replaceAll(/</g, '&lt;')
        .replaceAll(/>/g, '&gt;')
        .replaceAll(/"/g, '&quot;')
        .replaceAll(/'/g, '&apos;');
}

function buildGpxFromData(traceData) {
    const xmlStart1 = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd http://www.topografix.com/GPX/gpx_style/0/2 http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:gpx_style="http://www.topografix.com/GPX/gpx_style/0/2" version="1.1" creator="https://gpx.studio">
<metadata>
    <name>${encodeString(traceData.name)}</name>
    <author>
        <name>gpx.studio</name>
        <link href="https://gpx.studio"></link>
    </author>
</metadata>
`;
    const xmlEnd = `</gpx>`;
    let tracksOutput = '';
    let waypointsOutput = '';

    if (traceData.Tracks) {
        traceData.Tracks.forEach(track => {
            tracksOutput += `<trk><name>${encodeString(track.name || traceData.name)}</name><type>Cycling</type>\n`;
            track.Segments.forEach(segment => {
                tracksOutput += '    <trkseg>\n';
                segment.Points.forEach(point => {
                    tracksOutput += `    <trkpt lat="${point.lat}" lon="${point.lng}">\n`;
                    if (point.ele != null) tracksOutput += `        <ele>${point.ele.toFixed(1)}</ele>\n`;
                    if (point.time != null) tracksOutput += `        <time>${new Date(point.time).toISOString()}</time>\n`;

                    let extensions = '';
                    if (point.hr != null || point.cad != null || point.atemp != null) {
                        extensions += '        <extensions><gpxtpx:TrackPointExtension>\n';
                        if (point.atemp != null) extensions += `            <gpxtpx:atemp>${point.atemp}</gpxtpx:atemp>\n`;
                        if (point.hr != null) extensions += `            <gpxtpx:hr>${point.hr}</gpxtpx:hr>\n`;
                        if (point.cad != null) extensions += `            <gpxtpx:cad>${point.cad}</gpxtpx:cad>\n`;
                        extensions += '        </gpxtpx:TrackPointExtension></extensions>\n';
                    }
                    tracksOutput += extensions;
                    tracksOutput += '    </trkpt>\n';
                });
                tracksOutput += '    </trkseg>\n';
            });
            tracksOutput += '</trk>\n';
        });
    }

    if (traceData.Waypoints) {
        traceData.Waypoints.forEach(wpt => {
            waypointsOutput += `<wpt lat="${wpt.lat}" lon="${wpt.lng}">\n`;
            if (wpt.ele != null) waypointsOutput += `    <ele>${wpt.ele.toFixed(1)}</ele>\n`;
            if (wpt.name) waypointsOutput += `    <name>${encodeString(wpt.name)}</name>\n`;
            if (wpt.cmt) waypointsOutput += `    <cmt>${encodeString(wpt.cmt)}</cmt>\n`;
            if (wpt.desc) waypointsOutput += `    <desc>${encodeString(wpt.desc)}</desc>\n`;
            if (wpt.sym) waypointsOutput += `    <sym>${wpt.sym}</sym>\n`;
            waypointsOutput += `</wpt>\n`;
        });
    }

    return xmlStart1 + waypointsOutput + tracksOutput + xmlEnd;
}


async function downloadFolderAsZip(folderId, folderName) {
    showNotification(`Preparing download for folder "${folderName}"...`, 'info');
    try {
        const response = await fetch(`${backendUrl}/api/folders`);
        if (!response.ok) throw new Error('Could not fetch folders.');

        const folders = await response.json();
        const targetFolder = folders.find(f => f.id == folderId);

        if (!targetFolder || !targetFolder.Traces || targetFolder.Traces.length === 0) {
            showNotification('No traces found in this folder.', 'info');
            return;
        }

        const zip = new JSZip();
        const promises = targetFolder.Traces.map(async (traceInfo) => {
            try {
                const traceResp = await fetch(`${backendUrl}/api/traces/${traceInfo.id}`);
                if (!traceResp.ok) {
                    console.error(`Failed to fetch trace ${traceInfo.id}`);
                    return; // Skip this trace
                }
                const traceData = await traceResp.json();
                const gpxString = buildGpxFromData(traceData);
                // Sanitize filename
                const filename = (traceData.name || `trace_${traceData.id}`).replace(/[^a-z0-9_.-]/gi, '_') + '.gpx';
                zip.file(filename, gpxString);
            } catch (e) {
                console.error(`Error processing trace ${traceInfo.id}:`, e);
            }
        });

        await Promise.all(promises);

        zip.generateAsync({ type: "blob" }).then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${folderName.replace(/[^a-z0-9_.-]/gi, '_')}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Download started.', 'success');
        });

    } catch (error) {
        console.error('Error preparing download:', error);
        showNotification('Failed to prepare download.', 'error');
    }
}

let isSaving = false;
window.saveTrace = async function(trace, folderId) {
    if (isSaving) {
        showNotification('A save operation is already in progress.', 'info');
        return;
    }
    isSaving = true;
    showNotification(`Saving trace "${trace.name}"...`, 'info');

    try {
        let targetFolderId = folderId;
        if (!targetFolderId) {
            const foldersResponse = await fetch(`${backendUrl}/api/folders`);
            if (!foldersResponse.ok) throw new Error('Could not fetch folders to find default.');
            const folders = await foldersResponse.json();
            const defaultFolder = folders.find(f => f.is_default);
            if (!defaultFolder) throw new Error('No default folder found.');
            targetFolderId = defaultFolder.id;
        }

        const traceJSON = window.buttons.serializeTrace(trace);
        traceJSON.folderId = targetFolderId;

        const method = trace.id ? 'PUT' : 'POST';
        const url = trace.id ? `${backendUrl}/api/traces/${trace.id}` : `${backendUrl}/api/traces`;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(traceJSON),
        });

        if (response.ok) {
            showNotification('Trace saved successfully!', 'success');
            if (method === 'POST') {
                const newTraceData = await response.json();
                trace.id = newTraceData.id; // Store the new ID
            }
            loadExplorerData();
        } else {
            const errorData = await response.json();
            showNotification(`Error saving trace: ${errorData.error}`, 'error');
        }
    } catch (e) {
        console.error("Error saving trace:", e);
        showNotification('An error occurred while saving the trace.', 'error');
    } finally {
        isSaving = false;
    }
};
