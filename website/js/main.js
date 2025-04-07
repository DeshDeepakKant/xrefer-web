/**
 * Main application module for XRefer visualization.
 * Initializes and coordinates all components.
 */
class EventBus {
    /**
     * Initialize the event bus
     */
    constructor() {
        this.subscribers = {};
        console.log("EventBus initialized");
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }

        this.subscribers[event].push(callback);
        console.log(`Subscribed to event: ${event}`);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    unsubscribe(event, callback) {
        if (!this.subscribers[event]) {
            return;
        }

        this.subscribers[event] = this.subscribers[event].filter(
            subscriber => subscriber !== callback
        );
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        console.log(`Event emitted: ${event}`, data);
        if (!this.subscribers[event]) {
            console.warn(`No subscribers for event: ${event}`);
            return;
        }

        this.subscribers[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
}

class XReferVisualization {
    /**
     * Initialize the XRefer visualization application
     * @param {string} dataUrl - URL of the JSON data file
     */
    constructor(dataUrl) {
        console.log("XReferVisualization constructor called with URL:", dataUrl);
        this.dataUrl = dataUrl;
        this.eventBus = new EventBus();
        this.dataAdapter = null;
        this.visualization = null;
        this.uiManager = null;

        this._initialize();
    }

    /**
     * Initialize the application
     */
    async _initialize() {
        try {
            console.log("Beginning initialization sequence");
            
            // Show loading indicator
            this._showLoadingIndicator();

            // Initialize data adapter
            console.log("Creating data adapter");
            this.dataAdapter = new XReferDataAdapter();

            console.log("Loading data from:", this.dataUrl);
            // Load data
            await this.dataAdapter.loadData(this.dataUrl);
            console.log("Data loaded successfully");

            if (!this.dataAdapter.cytoscapeElements) {
                throw new Error("No cytoscape elements were created from the data");
            }

            // Initialize visualization
            const graphContainer = document.getElementById('graph-container');
            if (!graphContainer) {
                throw new Error("Graph container element not found");
            }

            console.log("Initializing visualization with",
                this.dataAdapter.cytoscapeElements.nodes.length, "nodes and",
                this.dataAdapter.cytoscapeElements.edges.length, "edges");

            this.visualization = new ClusterVisualization(
                graphContainer,
                this.dataAdapter.cytoscapeElements,
                this.eventBus
            );

            // Initialize UI manager
            console.log("Creating UI manager");
            this.uiManager = new UIManager(
                this.dataAdapter.data,
                this.visualization,
                this.eventBus
            );

            // Initialize UI with data
            console.log("Initializing UI");
            this.uiManager.initialize(this.dataAdapter);

            // Set up window resize handler
            window.addEventListener('resize', this._handleResize.bind(this));

            // Hide loading indicator after a short delay to ensure graph is rendered
            console.log("Setup complete, hiding loading indicator in 2 seconds");
            setTimeout(() => {
                this._hideLoadingIndicator();
                // Force a resize to ensure graph is properly sized
                this._handleResize();
                
                // Force layout to be applied
                if (this.visualization && this.visualization.cy) {
                    console.log("Applying initial layout");
                    this.visualization.applyLayout('circle');
                    
                    // Check if any elements are visible
                    const visibleNodes = this.visualization.cy.nodes().filter(node => node.visible()).length;
                    console.log(`Visible nodes after initialization: ${visibleNodes}`);
                    
                    if (visibleNodes === 0) {
                        console.warn("No visible nodes! Trying to fix...");
                        // Force visibility
                        this.visualization.cy.nodes().style('visibility', 'visible');
                        this.visualization.cy.edges().style('visibility', 'visible');
                        
                        // Force layout again
                        this.visualization.applyLayout('circle');
                    }
                }
            }, 2000);

        } catch (error) {
            console.error('Error initializing application:', error);
            this._showError(`Failed to initialize visualization: ${error.message}`);
        }
    }

    /**
     * Handle window resize
     */
    _handleResize() {
        console.log("Window resize detected");
        // Ensure graph container fills available space
        if (this.visualization && this.visualization.cy) {
            console.log("Resizing visualization");
            this.visualization.cy.resize();
            this.visualization.cy.fit();
        }
    }

    /**
     * Show loading indicator
     */
    _showLoadingIndicator() {
        console.log("Showing loading indicator");
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        } else {
            console.error("Loading overlay element not found");
        }
    }

    /**
     * Hide loading indicator
     */
    _hideLoadingIndicator() {
        console.log("Hiding loading indicator");
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        } else {
            console.error("Loading overlay element not found");
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    _showError(message) {
        this._hideLoadingIndicator();

        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.id = 'error-overlay';
        errorOverlay.style.position = 'fixed';
        errorOverlay.style.top = '0';
        errorOverlay.style.left = '0';
        errorOverlay.style.right = '0';
        errorOverlay.style.bottom = '0';
        errorOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        errorOverlay.style.display = 'flex';
        errorOverlay.style.alignItems = 'center';
        errorOverlay.style.justifyContent = 'center';
        errorOverlay.style.zIndex = '2000';

        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.style.backgroundColor = '#fff';
        errorContainer.style.borderRadius = '8px';
        errorContainer.style.padding = '20px';
        errorContainer.style.maxWidth = '500px';
        errorContainer.style.width = '90%';
        errorContainer.style.textAlign = 'center';

        // Create error icon
        const errorIcon = document.createElement('div');
        errorIcon.innerHTML = '⚠️';
        errorIcon.style.fontSize = '3rem';
        errorIcon.style.marginBottom = '15px';

        // Create error message
        const errorMessage = document.createElement('div');
        errorMessage.textContent = message;
        errorMessage.style.marginBottom = '20px';

        // Create dismiss button
        const dismissButton = document.createElement('button');
        dismissButton.textContent = 'Dismiss';
        dismissButton.style.padding = '8px 20px';
        dismissButton.style.backgroundColor = '#2B65EC';
        dismissButton.style.color = 'white';
        dismissButton.style.border = 'none';
        dismissButton.style.borderRadius = '4px';
        dismissButton.style.cursor = 'pointer';

        dismissButton.addEventListener('click', () => {
            errorOverlay.remove();
        });

        // Assemble error overlay
        errorContainer.appendChild(errorIcon);
        errorContainer.appendChild(errorMessage);
        errorContainer.appendChild(dismissButton);
        errorOverlay.appendChild(errorContainer);

        // Add to document
        document.body.appendChild(errorOverlay);
    }
}

// Initialize application when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing application");
    // Initialize application with data URL
    window.app = new XReferVisualization('data/demo_cluster_data.json');
});
