/**
 * UI module for XRefer visualization.
 * Handles user interface components and interactions.
 */
class UIManager {
    /**
     * Initialize the UI manager
     * @param {Object} data - XRefer data
     * @param {ClusterVisualization} visualization - Visualization instance
     * @param {EventBus} eventBus - Event bus for communication
     */
    constructor(data, visualization, eventBus) {
        this.data = data;
        this.visualization = visualization;
        this.eventBus = eventBus;
        this.dataAdapter = null;
        
        // Debug message
        console.log("Initializing UI Manager");
        
        this._initializeComponents();
        this._setupEventListeners();
    }
    
    /**
     * Initialize UI components
     */
    _initializeComponents() {
        // Initialize search
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        
        // Initialize cluster list
        this.clusterList = document.getElementById('cluster-list');
        
        // Initialize zoom controls
        this.zoomInButton = document.getElementById('zoom-in');
        this.zoomOutButton = document.getElementById('zoom-out');
        this.zoomResetButton = document.getElementById('zoom-reset');
        
        // Initialize layout controls
        this.layoutSelect = document.getElementById('layout-select');
        
        // Initialize filter controls
        this.artifactFilterCheckboxes = {
            apis: document.getElementById('filter-apis'),
            strings: document.getElementById('filter-strings'),
            libraries: document.getElementById('filter-libraries'),
            capa: document.getElementById('filter-capa')
        };
        
        this.clusterTypeFilterContainer = document.getElementById('cluster-type-filters');
        
        // Initialize info panel
        this.panelTitle = document.getElementById('panel-title');
        this.clusterDescription = document.getElementById('cluster-description');
        this.clusterMetadata = document.getElementById('cluster-metadata');
        this.functionsTab = document.getElementById('tab-functions');
        this.artifactsTab = document.getElementById('tab-artifacts');
        this.relationshipsTab = document.getElementById('tab-relationships');
        
        // Initialize tab buttons
        this.tabButtons = document.querySelectorAll('.tab-button');
        
        // Initialize theme toggle
        this.themeToggle = document.getElementById('theme-toggle');
        
        // Initialize fullscreen toggle
        this.fullscreenToggle = document.getElementById('fullscreen-toggle');
    }
    
    /**
     * Set up event listeners for UI components
     */
    _setupEventListeners() {
        // Debug
        console.log("Setting up event listeners");
        
        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this._handleSearchInput.bind(this));
        } else {
            console.error("Search input element not found");
        }
        
        // Zoom controls
        if (this.zoomInButton && this.zoomOutButton && this.zoomResetButton) {
            this.zoomInButton.addEventListener('click', () => {
                console.log("Zoom in clicked");
                this.visualization.zoomIn();
            });
            
            this.zoomOutButton.addEventListener('click', () => {
                console.log("Zoom out clicked");
                this.visualization.zoomOut();
            });
            
            this.zoomResetButton.addEventListener('click', () => {
                console.log("Zoom reset clicked");
                this.visualization.resetZoom();
            });
        } else {
            console.error("Zoom control elements not found");
        }
        
        // Layout select
        if (this.layoutSelect) {
            this.layoutSelect.addEventListener('change', () => {
                console.log("Layout changed to:", this.layoutSelect.value);
                this.eventBus.emit('setLayout', this.layoutSelect.value);
            });
        } else {
            console.error("Layout select element not found");
        }
        
        // Filter checkboxes
        if (Object.values(this.artifactFilterCheckboxes).every(el => el !== null)) {
            Object.entries(this.artifactFilterCheckboxes).forEach(([key, checkbox]) => {
                checkbox.addEventListener('change', () => {
                    console.log(`Filter changed: ${key} = ${checkbox.checked}`);
                    this._applyFilters();
                });
            });
        } else {
            console.error("Some artifact filter checkboxes not found");
        }
        
        // Tab buttons
        if (this.tabButtons.length > 0) {
            this.tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all tabs
                    this.tabButtons.forEach(b => b.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    button.classList.add('active');
                    
                    // Hide all tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Show selected tab content
                    const tabId = button.getAttribute('data-tab');
                    const tabContent = document.getElementById(`tab-${tabId}`);
                    if (tabContent) {
                        tabContent.classList.add('active');
                    } else {
                        console.error(`Tab content not found: tab-${tabId}`);
                    }
                });
            });
        } else {
            console.error("Tab buttons not found");
        }
        
        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', this._toggleTheme.bind(this));
        } else {
            console.error("Theme toggle button not found");
        }
        
        // Fullscreen toggle
        if (this.fullscreenToggle) {
            this.fullscreenToggle.addEventListener('click', this._toggleFullscreen.bind(this));
        } else {
            console.error("Fullscreen toggle button not found");
        }
        
        // Listen for nodeSelected events
        this.eventBus.subscribe('nodeSelected', nodeData => {
            console.log("Node selected event received:", nodeData);
            this._updateInfoPanel(nodeData);
        });
    }
    
    /**
     * Initialize the UI with data
     * @param {XReferDataAdapter} dataAdapter - Data adapter instance
     */
    initialize(dataAdapter) {
        console.log("Initializing UI with data adapter");
        this.dataAdapter = dataAdapter;
        
        // Update metadata display
        this._updateMetadataDisplay();
        
        // Populate cluster list
        this._populateClusterList();
        
        // Set up cluster type filters
        this._setupClusterTypeFilters();
    }
    
    /**
     * Update metadata display
     */
    _updateMetadataDisplay() {
        const metadata = this.dataAdapter.getMetadata();
        if (!metadata) {
            console.warn("No metadata available");
            return;
        }
        
        console.log("Updating metadata display:", metadata);
        
        // Update binary name
        const binaryName = document.getElementById('binary-name');
        if (binaryName) {
            binaryName.textContent = metadata.project || 'XRefer Analysis';
        }
        
        // Update binary hash
        const binaryHash = document.getElementById('binary-hash');
        if (binaryHash) {
            binaryHash.textContent = metadata.sha256 ? `SHA256: ${metadata.sha256.substring(0, 8)}...` : '';
        }
    }
    
    /**
     * Populate cluster list
     */
    _populateClusterList() {
        if (!this.clusterList) {
            console.error("Cluster list element not found");
            return;
        }
        
        const clusters = this.dataAdapter.getClusters();
        console.log("Populating cluster list with", clusters.length, "clusters");
        
        this.clusterList.innerHTML = '';
        
        clusters.forEach(cluster => {
            const item = document.createElement('div');
            item.className = 'cluster-item';
            item.textContent = cluster.name || cluster.id;
            item.setAttribute('data-cluster-id', cluster.id);
            
            item.addEventListener('click', () => {
                console.log("Cluster item clicked:", cluster.id);
                this.eventBus.emit('focusNode', cluster.id);
            });
            
            this.clusterList.appendChild(item);
        });
    }
    
    /**
     * Set up cluster type filters
     */
    _setupClusterTypeFilters() {
        if (!this.clusterTypeFilterContainer) {
            console.error("Cluster type filter container not found");
            return;
        }
        
        const clusterTypes = this.dataAdapter.getClusterTypes();
        console.log("Setting up cluster type filters:", clusterTypes);
        
        this.clusterTypeFilterContainer.innerHTML = '';
        
        clusterTypes.forEach(type => {
            const label = document.createElement('label');
            label.className = 'filter-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.setAttribute('data-filter-type', type);
            
            checkbox.addEventListener('change', () => {
                console.log(`Cluster type filter changed: ${type} = ${checkbox.checked}`);
                this._applyFilters();
            });
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${type}`));
            
            this.clusterTypeFilterContainer.appendChild(label);
        });
    }
    
    /**
     * Apply filters to the visualization
     */
    _applyFilters() {
        console.log("Applying filters");
        
        // Collect artifact filter values
        const artifactFilters = {};
        if (this.artifactFilterCheckboxes) {
            Object.entries(this.artifactFilterCheckboxes).forEach(([key, checkbox]) => {
                if (checkbox) {
                    artifactFilters[key] = checkbox.checked;
                }
            });
        }
        
        // Collect cluster type filter values
        const clusterTypeFilters = {};
        if (this.clusterTypeFilterContainer) {
            this.clusterTypeFilterContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                const type = checkbox.getAttribute('data-filter-type');
                if (type) {
                    clusterTypeFilters[type] = checkbox.checked;
                }
            });
        }
        
        const filters = {
            artifacts: artifactFilters,
            clusterTypes: clusterTypeFilters
        };
        
        console.log("Filter values:", filters);
        
        // Apply filters to visualization
        if (this.visualization) {
            this.eventBus.emit('applyFilters', filters);
        }
    }
    
    /**
     * Handle search input
     * @param {Event} event - Input event
     */
    _handleSearchInput(event) {
        const query = event.target.value.trim().toLowerCase();
        
        if (!query) {
            this.searchResults.style.display = 'none';
            return;
        }
        
        console.log("Search query:", query);
        
        // Perform search across clusters, functions, and artifacts
        const results = this._performSearch(query);
        
        // Display results
        this._displaySearchResults(results);
    }
    
    /**
     * Perform search across all data
     * @param {string} query - Search query
     * @returns {Array} Search results
     */
    _performSearch(query) {
        console.log("Performing search for:", query);
        
        if (!this.dataAdapter) {
            console.error("Data adapter not available for search");
            return [];
        }
        
        const results = [];
        
        // Search in clusters
        const clusters = this.dataAdapter.getClusters();
        clusters.forEach(cluster => {
            const matchesCluster = 
                (cluster.name && cluster.name.toLowerCase().includes(query)) ||
                (cluster.description && cluster.description.toLowerCase().includes(query)) ||
                (cluster.id && cluster.id.toLowerCase().includes(query));
            
            if (matchesCluster) {
                results.push({
                    type: 'cluster',
                    id: cluster.id,
                    title: cluster.name || cluster.id,
                    description: cluster.description || ''
                });
            }
            
            // Search in functions
            if (cluster.nodes) {
                cluster.nodes.forEach(node => {
                    const matchesFunction = 
                        (node.label && node.label.toLowerCase().includes(query)) ||
                        (node.description && node.description.toLowerCase().includes(query)) ||
                        (node.id && node.id.toLowerCase().includes(query)) ||
                        (node.properties && node.properties.address && 
                         node.properties.address.toLowerCase().includes(query));
                    
                    if (matchesFunction) {
                        results.push({
                            type: 'function',
                            id: node.id,
                            title: node.label || node.id,
                            description: `Function in ${cluster.name || cluster.id}`,
                            clusterId: cluster.id
                        });
                    }
                });
            }
            
            // Search in artifacts
            if (cluster.artifacts) {
                // Search in APIs
                if (cluster.artifacts.apis) {
                    const matchingApis = cluster.artifacts.apis.filter(
                        api => api.toLowerCase().includes(query)
                    );
                    
                    if (matchingApis.length > 0) {
                        results.push({
                            type: 'artifact',
                            subtype: 'api',
                            id: cluster.id,
                            title: `APIs in ${cluster.name || cluster.id}`,
                            description: matchingApis.slice(0, 3).join(', ') + 
                                        (matchingApis.length > 3 ? '...' : '')
                        });
                    }
                }
                
                // Search in strings
                if (cluster.artifacts.strings) {
                    const matchingStrings = cluster.artifacts.strings.filter(
                        str => str.toLowerCase().includes(query)
                    );
                    
                    if (matchingStrings.length > 0) {
                        results.push({
                            type: 'artifact',
                            subtype: 'string',
                            id: cluster.id,
                            title: `Strings in ${cluster.name || cluster.id}`,
                            description: matchingStrings.slice(0, 3).join(', ') + 
                                        (matchingStrings.length > 3 ? '...' : '')
                        });
                    }
                }
                
                // Search in libraries
                if (cluster.artifacts.libraries) {
                    const matchingLibraries = cluster.artifacts.libraries.filter(
                        lib => lib.toLowerCase().includes(query)
                    );
                    
                    if (matchingLibraries.length > 0) {
                        results.push({
                            type: 'artifact',
                            subtype: 'library',
                            id: cluster.id,
                            title: `Libraries in ${cluster.name || cluster.id}`,
                            description: matchingLibraries.slice(0, 3).join(', ') + 
                                        (matchingLibraries.length > 3 ? '...' : '')
                        });
                    }
                }
                
                // Search in CAPA matches
                if (cluster.artifacts.capa_matches) {
                    const matchingCapa = cluster.artifacts.capa_matches.filter(
                        capa => capa.toLowerCase().includes(query)
                    );
                    
                    if (matchingCapa.length > 0) {
                        results.push({
                            type: 'artifact',
                            subtype: 'capa',
                            id: cluster.id,
                            title: `CAPA matches in ${cluster.name || cluster.id}`,
                            description: matchingCapa.slice(0, 3).join(', ') + 
                                        (matchingCapa.length > 3 ? '...' : '')
                        });
                    }
                }
            }
        });
        
        return results;
    }
    
    /**
     * Display search results
     * @param {Array} results - Search results
     */
    _displaySearchResults(results) {
        if (!this.searchResults) {
            console.error("Search results element not found");
            return;
        }
        
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-result no-results">No results found</div>';
            this.searchResults.style.display = 'block';
            return;
        }
        
        console.log("Displaying search results:", results.length);
        
        this.searchResults.innerHTML = '';
        
        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'search-result';
            
            const titleElement = document.createElement('div');
            titleElement.className = 'result-title';
            titleElement.textContent = result.title;
            
            const descriptionElement = document.createElement('div');
            descriptionElement.className = 'result-description';
            descriptionElement.textContent = result.description;
            
            resultElement.appendChild(titleElement);
            resultElement.appendChild(descriptionElement);
            
            resultElement.addEventListener('click', () => {
                console.log("Search result clicked:", result);
                
                // Hide search results
                this.searchResults.style.display = 'none';
                
                // Clear search input
                if (this.searchInput) {
                    this.searchInput.value = '';
                }
                
                // Handle click based on result type
                if (result.type === 'cluster' || result.type === 'function') {
                    this.eventBus.emit('focusNode', result.id);
                } else if (result.type === 'artifact') {
                    // For artifacts, focus the cluster and switch to artifacts tab
                    this.eventBus.emit('focusNode', result.id);
                    
                    // Switch to artifacts tab
                    const artifactsTabButton = document.querySelector('.tab-button[data-tab="artifacts"]');
                    if (artifactsTabButton) {
                        artifactsTabButton.click();
                    }
                }
            });
            
            this.searchResults.appendChild(resultElement);
        });
        
        this.searchResults.style.display = 'block';
    }
    
    /**
     * Update info panel with node data
     * @param {Object} nodeData - Data of the selected node
     */
    _updateInfoPanel(nodeData) {
        console.log("Updating info panel with node data:", nodeData);
        
        if (!this.panelTitle || !this.clusterDescription || !this.clusterMetadata) {
            console.error("Info panel elements not found");
            return;
        }
        
        // Update panel title
        this.panelTitle.textContent = nodeData.data.label || nodeData.id;
        
        // Update description
        this.clusterDescription.innerHTML = '';
        
        const description = document.createElement('p');
        description.textContent = nodeData.data.description || 'No description available';
        this.clusterDescription.appendChild(description);
        
        // Update metadata
        this.clusterMetadata.innerHTML = '';
        
        const metadataList = document.createElement('dl');
        
        // Add ID
        const dtId = document.createElement('dt');
        dtId.textContent = 'ID';
        
        const ddId = document.createElement('dd');
        ddId.textContent = nodeData.id;
        
        metadataList.appendChild(dtId);
        metadataList.appendChild(ddId);
        
        // If node is a function, add address
        if (nodeData.data.type === 'function' && nodeData.data.address) {
            const dtAddress = document.createElement('dt');
            dtAddress.textContent = 'Address';
            
            const ddAddress = document.createElement('dd');
            ddAddress.textContent = nodeData.data.address;
            
            metadataList.appendChild(dtAddress);
            metadataList.appendChild(ddAddress);
        }
        
        // If node is a cluster, add artifact counts
        if (nodeData.data.type === 'cluster' && nodeData.data.artifacts) {
            const artifacts = nodeData.data.artifacts;
            
            // Add API count
            if (artifacts.apis && artifacts.apis.length > 0) {
                const dtApis = document.createElement('dt');
                dtApis.textContent = 'APIs';
                
                const ddApis = document.createElement('dd');
                ddApis.textContent = artifacts.apis.length;
                
                metadataList.appendChild(dtApis);
                metadataList.appendChild(ddApis);
            }
            
            // Add strings count
            if (artifacts.strings && artifacts.strings.length > 0) {
                const dtStrings = document.createElement('dt');
                dtStrings.textContent = 'Strings';
                
                const ddStrings = document.createElement('dd');
                ddStrings.textContent = artifacts.strings.length;
                
                metadataList.appendChild(dtStrings);
                metadataList.appendChild(ddStrings);
            }
            
            // Add libraries count
            if (artifacts.libraries && artifacts.libraries.length > 0) {
                const dtLibraries = document.createElement('dt');
                dtLibraries.textContent = 'Libraries';
                
                const ddLibraries = document.createElement('dd');
                ddLibraries.textContent = artifacts.libraries.length;
                
                metadataList.appendChild(dtLibraries);
                metadataList.appendChild(ddLibraries);
            }
            
            // Add CAPA matches count
            if (artifacts.capa_matches && artifacts.capa_matches.length > 0) {
                const dtCapa = document.createElement('dt');
                dtCapa.textContent = 'CAPA Matches';
                
                const ddCapa = document.createElement('dd');
                ddCapa.textContent = artifacts.capa_matches.length;
                
                metadataList.appendChild(dtCapa);
                metadataList.appendChild(ddCapa);
            }
            
            // Update function list
            this._updateFunctionsList(nodeData);
            
            // Update artifacts lists
            this._updateArtifactsList(nodeData);
        }
        
        this.clusterMetadata.appendChild(metadataList);
    }
    
    /**
     * Update the functions list
     * @param {Object} nodeData - Data of the selected node
     */
    _updateFunctionsList(nodeData) {
        const functionsList = document.getElementById('functions-list');
        if (!functionsList) {
            console.error("Functions list element not found");
            return;
        }
        
        functionsList.innerHTML = '';
        
        // Only show functions for cluster nodes
        if (nodeData.data.type !== 'cluster') {
            const noFunctions = document.createElement('p');
            noFunctions.className = 'no-items';
            noFunctions.textContent = 'Not applicable for this node type';
            functionsList.appendChild(noFunctions);
            return;
        }
        
        // Find the cluster
        const cluster = this.dataAdapter.findClusterById(nodeData.id);
        if (!cluster || !cluster.nodes || cluster.nodes.length === 0) {
            const noFunctions = document.createElement('p');
            noFunctions.className = 'no-items';
            noFunctions.textContent = 'No functions available';
            functionsList.appendChild(noFunctions);
            return;
        }
        
        console.log("Updating functions list with", cluster.nodes.length, "functions");
        
        const list = document.createElement('ul');
        list.className = 'function-items';
        
        // Sort functions by label
        const sortedNodes = [...cluster.nodes].sort((a, b) => {
            const labelA = a.label || a.id;
            const labelB = b.label || b.id;
            return labelA.localeCompare(labelB);
        });
        
        sortedNodes.forEach(node => {
            const item = document.createElement('li');
            item.className = 'function-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'function-name';
            nameSpan.textContent = node.label || node.id;
            
            const addressSpan = document.createElement('span');
            addressSpan.className = 'function-address';
            addressSpan.textContent = node.properties && node.properties.address ? 
                node.properties.address : '';
            
            item.appendChild(nameSpan);
            item.appendChild(addressSpan);
            
            item.addEventListener('click', () => {
                console.log("Function item clicked:", node.id);
                this.eventBus.emit('focusNode', node.id);
            });
            
            list.appendChild(item);
        });
        
        functionsList.appendChild(list);
    }
    
    /**
     * Update the artifacts lists
     * @param {Object} nodeData - Data of the selected node
     */
    _updateArtifactsList(nodeData) {
        // Only update artifacts for cluster nodes
        if (nodeData.data.type !== 'cluster' || !nodeData.data.artifacts) {
            return;
        }
        
        const artifacts = nodeData.data.artifacts;
        
        console.log("Updating artifacts list:", artifacts);
        
        // Update APIs list
        this._updateArtifactCategory('apis-list', artifacts.apis || []);
        
        // Update strings list
        this._updateArtifactCategory('strings-list', artifacts.strings || []);
        
        // Update libraries list
        this._updateArtifactCategory('libraries-list', artifacts.libraries || []);
        
        // Update CAPA matches list
        this._updateArtifactCategory('capa-list', artifacts.capa_matches || []);
    }
    
    /**
     * Update a specific artifact category list
     * @param {string} elementId - ID of the element to update
     * @param {Array} items - Items to display
     */
    _updateArtifactCategory(elementId, items) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Artifact category element not found: ${elementId}`);
            return;
        }
        
        element.innerHTML = '';
        
        if (items.length === 0) {
            const noItems = document.createElement('p');
            noItems.className = 'no-items';
            noItems.textContent = 'None';
            element.appendChild(noItems);
            return;
        }
        
        const sortedItems = [...items].sort();
        
        const list = document.createElement('ul');
        
        sortedItems.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item;
            list.appendChild(listItem);
        });
        
        element.appendChild(list);
    }
    
    /**
     * Toggle dark/light theme
     */
    _toggleTheme() {
        document.body.classList.toggle('dark-theme');
        
        const themeIcon = this.themeToggle.querySelector('i');
        if (themeIcon) {
            if (document.body.classList.contains('dark-theme')) {
                themeIcon.className = 'fas fa-sun';
            } else {
                themeIcon.className = 'fas fa-moon';
            }
        }
    }
    
    /**
     * Toggle fullscreen mode
     */
    _toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            
            const fullscreenIcon = this.fullscreenToggle.querySelector('i');
            if (fullscreenIcon) {
                fullscreenIcon.className = 'fas fa-compress';
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                
                const fullscreenIcon = this.fullscreenToggle.querySelector('i');
                if (fullscreenIcon) {
                    fullscreenIcon.className = 'fas fa-expand';
                }
            }
        }
    }
}
