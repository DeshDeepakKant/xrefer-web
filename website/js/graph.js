/**
 * Graph visualization module for XRefer.
 * Handles rendering and interaction with the cluster graph.
 */
class ClusterVisualization {
    /**
     * Initialize the cluster visualization
     * @param {HTMLElement} container - DOM container for the visualization
     * @param {Object} data - Processed XRefer data
     * @param {EventBus} eventBus - Event bus for communication
     */
    constructor(container, data, eventBus) {
        console.log("ClusterVisualization constructor called");
        console.log("Container:", container);
        console.log("Data:", JSON.stringify(data).substring(0, 500) + "...");

        this.container = container;
        this.data = data;
        this.eventBus = eventBus;
        this.expandedClusters = new Set();

        // Ensure we have proper data format
        if (!data.nodes && !data.edges && data.elements) {
            console.log("Converting from elements format");
            this.data = data.elements;
        }

        this._initializeCytoscape();
        this._setupEventHandlers();
        this._applyInitialLayout();
    }

    /**
     * Initialize Cytoscape instance with appropriate options
     */
    _initializeCytoscape() {
        console.log("Initializing Cytoscape");
        
        // Register Cytoscape extensions if available
        if (typeof cytoscapeDagre !== 'undefined') {
            console.log("Dagre extension available");
            cytoscape.use(cytoscapeDagre);
        } else {
            console.warn("Dagre extension not available");
        }
        
        if (typeof cytoscapeCoseBilkent !== 'undefined') {
            console.log("CoseBilkent extension available");
            cytoscape.use(cytoscapeCoseBilkent);
        } else {
            console.warn("CoseBilkent extension not available");
        }

        // Ensure we have proper data structure
        if (!this.data.nodes && !this.data.edges) {
            console.error("Invalid data format for Cytoscape");
            console.log("Data received:", this.data);
            
            // Try to create basic elements for visualization
            this.data = {
                nodes: [
                    { data: { id: 'demo-node-1', label: 'Demo Node 1', type: 'cluster' } },
                    { data: { id: 'demo-node-2', label: 'Demo Node 2', type: 'cluster' } }
                ],
                edges: [
                    { data: { id: 'demo-edge-1', source: 'demo-node-1', target: 'demo-node-2', relationship: 'demo' } }
                ]
            };
            console.log("Created demo data for visualization");
        }

        try {
            this.cy = cytoscape({
                container: this.container,
                elements: this.data,
                style: [
                    // Base node styles
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': '#fff',
                            'text-outline-width': 2,
                            'text-outline-color': '#555',
                            'font-size': '12px',
                            'visibility': 'visible' // Ensure nodes are visible
                        }
                    },
                    // Cluster node styles
                    {
                        selector: 'node[type="cluster"]',
                        style: {
                            'shape': 'roundrectangle',
                            'background-color': '#2B65EC',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'padding': '15px',
                            'text-wrap': 'ellipsis',
                            'text-max-width': '100px',
                            'width': 'label',
                            'height': 'label',
                            'min-width': 100,
                            'min-height': 40,
                            'visibility': 'visible' // Ensure clusters are visible
                        }
                    },
                    // Function node styles
                    {
                        selector: 'node[type="function"]',
                        style: {
                            'shape': 'ellipse',
                            'background-color': '#66B2FF',
                            'width': 30,
                            'height': 30,
                            'font-size': '10px',
                            'visibility': 'visible' // Ensure functions are visible
                        }
                    },
                    // Edge styles
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': '#999',
                            'target-arrow-color': '#999',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'label': 'data(relationship)',
                            'font-size': '10px',
                            'text-rotation': 'autorotate',
                            'text-background-color': '#FFF',
                            'text-background-opacity': 0.7,
                            'text-background-padding': 2,
                            'visibility': 'visible' // Ensure edges are visible
                        }
                    },
                    // Contains relationship
                    {
                        selector: 'edge[relationship="contains"]',
                        style: {
                            'line-style': 'dashed',
                            'line-color': '#2B65EC',
                            'target-arrow-color': '#2B65EC'
                        }
                    },
                    // References relationship
                    {
                        selector: 'edge[relationship="references"]',
                        style: {
                            'line-color': '#F7A65A',
                            'target-arrow-color': '#F7A65A'
                        }
                    },
                    // Calls relationship
                    {
                        selector: 'edge[relationship="calls"]',
                        style: {
                            'line-color': '#66B2FF',
                            'target-arrow-color': '#66B2FF'
                        }
                    },
                    // Highlighted elements
                    {
                        selector: '.highlighted',
                        style: {
                            'background-color': '#F7A65A',
                            'line-color': '#F7A65A',
                            'target-arrow-color': '#F7A65A',
                            'transition-property': 'background-color, line-color, target-arrow-color',
                            'transition-duration': '0.5s'
                        }
                    },
                    // Faded elements
                    {
                        selector: '.faded',
                        style: {
                            'opacity': 0.25,
                            'transition-property': 'opacity',
                            'transition-duration': '0.5s'
                        }
                    }
                ],
                layout: {
                    name: 'preset' // Initial layout - will be changed after initialization
                },
                wheelSensitivity: 0.3,
                minZoom: 0.1,
                maxZoom: 3
            });
            
            console.log("Cytoscape initialized successfully");
            
            // Check if elements are rendered
            const renderedNodes = this.cy.nodes().length;
            const renderedEdges = this.cy.edges().length;
            
            console.log(`Rendered elements: ${renderedNodes} nodes, ${renderedEdges} edges`);
            
            if (renderedNodes === 0) {
                console.warn("No nodes were rendered!");
            }
        } catch (error) {
            console.error("Error initializing Cytoscape:", error);
        }
    }

    /**
     * Set up event handlers for user interaction
     */
    _setupEventHandlers() {
        // Node selection
        this.cy.on('tap', 'node', event => {
            const node = event.target;
            this._highlightRelatedNodes(node);

            // Debug logging
            console.log("Node selected:", node.id(), node.data());

            // Dispatch event to update the info panel
            this.eventBus.emit('nodeSelected', {
                id: node.id(),
                data: node.data()
            });
            
            // Force panel update
            this._updateInfoPanel(node);
        });

        // Node unselection
        this.cy.on('unselect', 'node', event => {
            this._resetHighlighting();
        });

        // Double-click to expand/collapse cluster
        this.cy.on('dblclick', 'node[type="cluster"]', event => {
            const node = event.target;
            const clusterId = node.id();
            
            console.log("Double-click on cluster:", clusterId);

            if (this.expandedClusters.has(clusterId)) {
                this._collapseCluster(clusterId);
            } else {
                this._expandCluster(clusterId);
            }
        });

        // Listen for focusNode events
        this.eventBus.subscribe('focusNode', nodeId => {
            this.focusNode(nodeId);
        });

        // Listen for clearSelection events
        this.eventBus.subscribe('clearSelection', () => {
            this.cy.elements().unselect();
            this._resetHighlighting();
        });

        // Listen for setLayout events
        this.eventBus.subscribe('setLayout', layoutName => {
            this.applyLayout(layoutName);
        });
    }
    
    /**
     * Update info panel directly from the visualization
     */
    _updateInfoPanel(node) {
        // Get references to panel elements
        const panelTitle = document.getElementById('panel-title');
        const clusterDescription = document.getElementById('cluster-description');
        const clusterMetadata = document.getElementById('cluster-metadata');
        
        if (!panelTitle || !clusterDescription || !clusterMetadata) {
            console.error("Info panel elements not found");
            return;
        }
        
        // Set content based on node type
        if (node.data('type') === 'cluster') {
            panelTitle.textContent = node.data('label') || node.id();
            
            // Set description
            let description = document.createElement('p');
            description.textContent = node.data('description') || 'No description available';
            clusterDescription.innerHTML = '';
            clusterDescription.appendChild(description);
            
            // Set metadata
            clusterMetadata.innerHTML = '';
            let metadataList = document.createElement('dl');
            
            // Add ID
            let dtId = document.createElement('dt');
            dtId.textContent = 'ID';
            let ddId = document.createElement('dd');
            ddId.textContent = node.id();
            metadataList.appendChild(dtId);
            metadataList.appendChild(ddId);
            
            // Add artifacts count if available
            if (node.data('artifacts')) {
                const artifacts = node.data('artifacts');
                for (const [type, items] of Object.entries(artifacts)) {
                    if (items && items.length > 0) {
                        let dt = document.createElement('dt');
                        dt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                        let dd = document.createElement('dd');
                        dd.textContent = items.length;
                        metadataList.appendChild(dt);
                        metadataList.appendChild(dd);
                    }
                }
            }
            
            clusterMetadata.appendChild(metadataList);
            
            // Also update function list
            this._updateFunctionsList(node);
            
            // And artifacts list
            this._updateArtifactsList(node);
        } else if (node.data('type') === 'function') {
            panelTitle.textContent = node.data('label') || node.id();
            
            let description = document.createElement('p');
            description.textContent = node.data('description') || 'No description available';
            clusterDescription.innerHTML = '';
            clusterDescription.appendChild(description);
            
            // Set function metadata
            clusterMetadata.innerHTML = '';
            let metadataList = document.createElement('dl');
            
            // Add ID
            let dtId = document.createElement('dt');
            dtId.textContent = 'ID';
            let ddId = document.createElement('dd');
            ddId.textContent = node.id();
            metadataList.appendChild(dtId);
            metadataList.appendChild(ddId);
            
            // Add address if available
            if (node.data('address')) {
                let dtAddr = document.createElement('dt');
                dtAddr.textContent = 'Address';
                let ddAddr = document.createElement('dd');
                ddAddr.textContent = node.data('address');
                metadataList.appendChild(dtAddr);
                metadataList.appendChild(ddAddr);
            }
            
            clusterMetadata.appendChild(metadataList);
        }
    }
    
    /**
     * Update functions list
     */
    _updateFunctionsList(node) {
        const functionsTab = document.getElementById('tab-functions');
        const functionsList = document.getElementById('functions-list');
        
        if (!functionsTab || !functionsList) {
            console.error("Functions tab elements not found");
            return;
        }
        
        functionsList.innerHTML = '';
        
        // Find all function nodes in this cluster
        const functionNodes = this.cy.nodes(`node[type="function"][parent="${node.id()}"]`);
        
        if (functionNodes.length === 0) {
            const noFunctions = document.createElement('p');
            noFunctions.className = 'no-items';
            noFunctions.textContent = 'No functions available';
            functionsList.appendChild(noFunctions);
            return;
        }
        
        const list = document.createElement('ul');
        list.className = 'function-items';
        
        functionNodes.forEach(funcNode => {
            const item = document.createElement('li');
            item.className = 'function-item';
            item.textContent = funcNode.data('label') || funcNode.id();
            
            // Add click handler
            item.addEventListener('click', () => {
                this.focusNode(funcNode.id());
            });
            
            list.appendChild(item);
        });
        
        functionsList.appendChild(list);
    }
    
    /**
     * Update artifacts list
     */
    _updateArtifactsList(node) {
        // Get the artifacts data
        const artifacts = node.data('artifacts');
        
        if (!artifacts) {
            console.warn("No artifacts data for node:", node.id());
            return;
        }
        
        // Update each artifact category
        this._updateArtifactCategory('apis', artifacts.apis || []);
        this._updateArtifactCategory('strings', artifacts.strings || []);
        this._updateArtifactCategory('libraries', artifacts.libraries || []);
        this._updateArtifactCategory('capa', artifacts.capa_matches || []);
    }
    
    /**
     * Update a specific artifact category
     */
    _updateArtifactCategory(category, items) {
        const listId = {
            'apis': 'apis-list',
            'strings': 'strings-list',
            'libraries': 'libraries-list',
            'capa': 'capa-list'
        }[category];
        
        const list = document.getElementById(listId);
        
        if (!list) {
            console.error(`Artifact list element not found: ${listId}`);
            return;
        }
        
        list.innerHTML = '';
        
        if (items.length === 0) {
            const noItems = document.createElement('p');
            noItems.className = 'no-items';
            noItems.textContent = 'None';
            list.appendChild(noItems);
            return;
        }
        
        const ul = document.createElement('ul');
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
        
        list.appendChild(ul);
    }

    /**
     * Apply initial layout to the graph
     */
    _applyInitialLayout() {
        // Check if we have nodes before applying layout
        if (this.cy.nodes().length === 0) {
            console.warn("No nodes to layout");
            return;
        }
        
        console.log("Applying initial layout with", this.cy.nodes().length, "nodes");
        
        this.applyLayout('circle');
        
        // Auto-fit the graph
        setTimeout(() => {
            this.cy.fit();
            this.cy.center();
        }, 100);
    }

    /**
     * Apply a layout to the graph
     * @param {string} layoutName - Name of the layout to apply
     */
    applyLayout(layoutName = 'circle') {
        console.log("Applying layout:", layoutName);
        
        const layoutOptions = {
            circle: {
                name: 'circle',
                padding: 50,
                animate: true,
                animationDuration: 500
            },
            grid: {
                name: 'grid',
                padding: 50,
                animate: true,
                animationDuration: 500
            },
            concentric: {
                name: 'concentric',
                padding: 50,
                animate: true,
                animationDuration: 500,
                concentric: node => node.data('type') === 'cluster' ? 2 : 1,
                levelWidth: () => 1
            },
            dagre: {
                name: 'dagre',
                padding: 50,
                rankDir: 'TB',
                animate: true,
                animationDuration: 500
            },
            breadthfirst: {
                name: 'breadthfirst',
                padding: 50,
                animate: true,
                animationDuration: 500
            },
            random: {
                name: 'random',
                padding: 50,
                animate: true,
                animationDuration: 500
            },
            cose: {
                name: 'cose-bilkent',
                padding: 50,
                animate: true,
                animationDuration: 500,
                nodeDimensionsIncludeLabels: true
            }
        };

        const layout = layoutOptions[layoutName] || layoutOptions.circle;
        this.cy.layout(layout).run();
    }

    /**
     * Focus on a specific node
     * @param {string} nodeId - ID of the node to focus on
     */
    focusNode(nodeId) {
        const node = this.cy.getElementById(nodeId);
        
        if (node.length === 0) {
            console.warn(`Node not found: ${nodeId}`);
            return;
        }
        
        // Select the node and update highlighting
        this.cy.elements().unselect();
        node.select();
        this._highlightRelatedNodes(node);
        
        // Center on the node
        this.cy.animate({
            fit: {
                eles: node.neighborhood().add(node),
                padding: 50
            },
            duration: 500
        });
        
        // Update info panel
        this._updateInfoPanel(node);
    }

    /**
     * Highlight nodes related to the selected node
     * @param {Object} node - Selected node
     */
    _highlightRelatedNodes(node) {
        // Reset any existing highlighting
        this._resetHighlighting();
        
        // Get connected elements
        const neighborhood = node.neighborhood();
        
        // Add highlighted class to the node and its neighborhood
        node.addClass('highlighted');
        neighborhood.addClass('highlighted');
        
        // Add faded class to all other elements
        this.cy.elements().not(neighborhood).not(node).addClass('faded');
    }

    /**
     * Reset all highlighting
     */
    _resetHighlighting() {
        this.cy.elements().removeClass('highlighted faded');
    }

    /**
     * Expand a cluster to show its functions
     * @param {string} clusterId - ID of the cluster to expand
     */
    _expandCluster(clusterId) {
        console.log(`Expanding cluster: ${clusterId}`);
        
        const clusterNode = this.cy.getElementById(clusterId);
        
        if (clusterNode.length === 0) {
            console.warn(`Cluster not found: ${clusterId}`);
            return;
        }
        
        // Mark as expanded
        this.expandedClusters.add(clusterId);
        
        // Get all function nodes for this cluster
        const functionNodes = this.cy.filter(`node[parent="${clusterId}"]`);
        
        // Show functions
        functionNodes.removeClass('hidden');
        
        // Update cluster node style
        clusterNode.style({
            'background-color': '#165082',
            'border-width': 3,
            'border-color': '#F7A65A'
        });
        
        // Re-apply layout
        this.applyLayout(this.cy.layout().options.name);
    }

    /**
     * Collapse a cluster to hide its functions
     * @param {string} clusterId - ID of the cluster to collapse
     */
    _collapseCluster(clusterId) {
        console.log(`Collapsing cluster: ${clusterId}`);
        
        const clusterNode = this.cy.getElementById(clusterId);
        
        if (clusterNode.length === 0) {
            console.warn(`Cluster not found: ${clusterId}`);
            return;
        }
        
        // Remove from expanded set
        this.expandedClusters.delete(clusterId);
        
        // Get all function nodes for this cluster
        const functionNodes = this.cy.filter(`node[parent="${clusterId}"]`);
        
        // Hide functions
        functionNodes.addClass('hidden');
        
        // Reset cluster node style
        clusterNode.style({
            'background-color': '#2B65EC',
            'border-width': 1,
            'border-color': '#2B65EC'
        });
        
        // Re-apply layout
        this.applyLayout(this.cy.layout().options.name);
    }

    /**
     * Zoom in on the graph
     */
    zoomIn() {
        const currentZoom = this.cy.zoom();
        this.cy.zoom({
            level: currentZoom * 1.2,
            renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
        });
    }

    /**
     * Zoom out on the graph
     */
    zoomOut() {
        const currentZoom = this.cy.zoom();
        this.cy.zoom({
            level: currentZoom / 1.2,
            renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
        });
    }

    /**
     * Reset zoom and position
     */
    resetZoom() {
        this.cy.fit();
        this.cy.center();
    }
}
