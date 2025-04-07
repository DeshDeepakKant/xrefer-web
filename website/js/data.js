/**
 * Data handling module for XRefer visualization.
 * Responsible for loading and processing cluster data.
 */
class XReferDataAdapter {
    /**
     * Initialize the data adapter
     */
    constructor() {
        this.data = null;
        this.cytoscapeElements = { nodes: [], edges: [] };
        console.log("XReferDataAdapter initialized");
    }

    /**
     * Load data from JSON file
     * @param {string} jsonPath - Path to JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async loadData(jsonPath) {
        try {
            console.log("Loading data from:", jsonPath);
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.statusText}`);
            }

            this.data = await response.json();
            console.log("Data loaded successfully:", this.data);
            
            if (!this.data.clusters || !Array.isArray(this.data.clusters)) {
                console.error("Invalid data format - missing clusters array");
                console.log("Data structure:", this.data);
            } else {
                console.log(`Found ${this.data.clusters.length} clusters in the data`);
            }
            
            this.cytoscapeElements = this.convertToCytoscapeFormat();

            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Convert XRefer JSON data to Cytoscape.js format
     * @returns {Object} Elements in Cytoscape.js format
     */
    convertToCytoscapeFormat() {
        console.log("Converting data to Cytoscape format");
        const elements = { nodes: [], edges: [] };

        // Process clusters
        if (this.data && this.data.clusters) {
            console.log("Processing clusters:", this.data.clusters.length);

            // First pass: Create cluster nodes
            this.data.clusters.forEach(cluster => {
                console.log(`Processing cluster: ${cluster.id} - ${cluster.name}`);
                
                // Add cluster node
                elements.nodes.push({
                    data: {
                        id: cluster.id,
                        label: cluster.name || cluster.id,
                        description: cluster.description || '',
                        type: 'cluster',
                        artifacts: cluster.artifacts || {},
                        api_trace: cluster.api_trace || []
                    }
                });

                // Add function nodes
                if (cluster.nodes && Array.isArray(cluster.nodes)) {
                    console.log(`Adding ${cluster.nodes.length} function nodes for cluster ${cluster.id}`);
                    cluster.nodes.forEach(node => {
                        elements.nodes.push({
                            data: {
                                id: node.id,
                                label: node.label || node.id,
                                description: node.description || '',
                                parent: cluster.id,
                                type: 'function',
                                address: node.properties ? node.properties.address : null,
                                calls: node.properties ? node.properties.calls : []
                            }
                        });
                    });
                } else {
                    console.warn(`No function nodes found for cluster ${cluster.id}`);
                }
            });

            // Second pass: Create edges between clusters
            this.data.clusters.forEach(cluster => {
                // Add edges between clusters based on subcluster_ids
                if (cluster.subcluster_ids && Array.isArray(cluster.subcluster_ids)) {
                    console.log(`Adding ${cluster.subcluster_ids.length} subcluster edges for ${cluster.id}`);
                    cluster.subcluster_ids.forEach(targetId => {
                        elements.edges.push({
                            data: {
                                id: `${cluster.id}-${targetId}`,
                                source: cluster.id,
                                target: targetId,
                                relationship: 'contains'
                            }
                        });
                    });
                }

                // Add edges based on cluster_refs
                if (cluster.cluster_refs) {
                    console.log(`Adding cluster reference edges for ${cluster.id}`);
                    Object.entries(cluster.cluster_refs).forEach(([nodeId, targetClusterId]) => {
                        elements.edges.push({
                            data: {
                                id: `${cluster.id}-${targetClusterId}-ref`,
                                source: cluster.id,
                                target: targetClusterId,
                                relationship: 'references'
                            }
                        });
                    });
                }

                // Add function-level edges
                if (cluster.edges && Array.isArray(cluster.edges)) {
                    console.log(`Adding ${cluster.edges.length} function-level edges for ${cluster.id}`);
                    cluster.edges.forEach(edge => {
                        elements.edges.push({
                            data: {
                                id: `${edge.source}-${edge.target}`,
                                source: edge.source,
                                target: edge.target,
                                relationship: edge.relationship || 'calls'
                            }
                        });
                    });
                }
            });

            // Add some direct connections between clusters if none exist
            if (elements.edges.length < this.data.clusters.length - 1) {
                console.log("Adding additional connections to ensure graph connectivity");
                for (let i = 0; i < this.data.clusters.length - 1; i++) {
                    elements.edges.push({
                        data: {
                            id: `auto-edge-${i}`,
                            source: this.data.clusters[i].id,
                            target: this.data.clusters[i+1].id,
                            relationship: 'related'
                        }
                    });
                }
            }

            console.log("Created elements:", elements.nodes.length, "nodes,", elements.edges.length, "edges");
            
            // Direct access to nodes and edges for debugging
            console.log("First 3 nodes:", elements.nodes.slice(0, 3));
            console.log("First 3 edges:", elements.edges.slice(0, 3));
        } else {
            console.error("No cluster data available for conversion");
            
            // Create demo data for visualization
            elements.nodes = [
                { data: { id: 'demo-node-1', label: 'Demo Node 1', type: 'cluster' } },
                { data: { id: 'demo-node-2', label: 'Demo Node 2', type: 'cluster' } }
            ];
            elements.edges = [
                { data: { id: 'demo-edge', source: 'demo-node-1', target: 'demo-node-2', relationship: 'demo' } }
            ];
            
            console.log("Created fallback demo data for visualization");
        }

        return elements;
    }

    /**
     * Get metadata from the loaded data
     * @returns {Object} Metadata object
     */
    getMetadata() {
        return this.data ? this.data.metadata : null;
    }

    /**
     * Get all clusters from the loaded data
     * @returns {Array} Array of cluster objects
     */
    getClusters() {
        return this.data ? this.data.clusters : [];
    }

    /**
     * Find a cluster by its ID
     * @param {string} clusterId - ID of the cluster to find
     * @returns {Object|null} Cluster object or null if not found
     */
    findClusterById(clusterId) {
        if (!this.data || !this.data.clusters) return null;

        return this.data.clusters.find(cluster => cluster.id === clusterId) || null;
    }

    /**
     * Find a node by its ID
     * @param {string} nodeId - ID of the node to find
     * @returns {Object|null} Node object or null if not found
     */
    findNodeById(nodeId) {
        if (!this.data || !this.data.clusters) return null;

        for (const cluster of this.data.clusters) {
            if (!cluster.nodes) continue;

            const node = cluster.nodes.find(n => n.id === nodeId);
            if (node) return node;
        }

        return null;
    }

    /**
     * Get unique cluster types from the data
     * @returns {Array} Array of unique cluster types
     */
    getClusterTypes() {
        if (!this.data || !this.data.clusters) return [];

        const types = new Set();

        this.data.clusters.forEach(cluster => {
            if (cluster.name) {
                // Extract primary type from name (e.g., "Ransomware Module" -> "Ransomware")
                const parts = cluster.name.split(/\s+/);
                if (parts.length > 0) {
                    types.add(parts[0]);
                }
            }
        });

        return Array.from(types);
    }

    /**
     * Search for nodes matching a query
     * @param {string} query - Search query
     * @returns {Array} Matching nodes
     */
    search(query) {
        if (!query || query.length < 2 || !this.data) return [];

        const results = [];
        const queryLower = query.toLowerCase();

        // Search clusters
        if (this.data.clusters) {
            this.data.clusters.forEach(cluster => {
                // Check cluster name and description
                const name = (cluster.name || '').toLowerCase();
                const description = (cluster.description || '').toLowerCase();

                if (name.includes(queryLower) || description.includes(queryLower)) {
                    results.push({
                        id: cluster.id,
                        label: cluster.name || cluster.id,
                        description: cluster.description || '',
                        type: 'cluster'
                    });
                }

                // Check cluster artifacts
                if (cluster.artifacts) {
                    // Check APIs
                    if (cluster.artifacts.apis && cluster.artifacts.apis.some(api => api.toLowerCase().includes(queryLower))) {
                        if (!results.some(r => r.id === cluster.id)) {
                            results.push({
                                id: cluster.id,
                                label: cluster.name || cluster.id,
                                description: `Cluster with API: ${cluster.artifacts.apis.find(api => api.toLowerCase().includes(queryLower))}`,
                                type: 'cluster'
                            });
                        }
                    }

                    // Check strings
                    if (cluster.artifacts.strings && cluster.artifacts.strings.some(str => str.toLowerCase().includes(queryLower))) {
                        if (!results.some(r => r.id === cluster.id)) {
                            results.push({
                                id: cluster.id,
                                label: cluster.name || cluster.id,
                                description: `Cluster with string: ${cluster.artifacts.strings.find(str => str.toLowerCase().includes(queryLower))}`,
                                type: 'cluster'
                            });
                        }
                    }
                }

                // Check functions
                if (cluster.nodes) {
                    cluster.nodes.forEach(node => {
                        const nodeLabel = (node.label || '').toLowerCase();
                        const nodeDesc = (node.description || '').toLowerCase();
                        const nodeAddr = (node.properties && node.properties.address) ? node.properties.address.toLowerCase() : '';

                        if (nodeLabel.includes(queryLower) || nodeDesc.includes(queryLower) || nodeAddr.includes(queryLower)) {
                            results.push({
                                id: node.id,
                                label: node.label || node.id,
                                description: node.description || '',
                                parentId: cluster.id,
                                parentName: cluster.name || cluster.id,
                                type: 'function',
                                address: node.properties ? node.properties.address : null
                            });
                        }
                    });
                }
            });
        }

        return results;
    }
}
