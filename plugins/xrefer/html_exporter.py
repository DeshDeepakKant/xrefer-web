# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import json
import shutil
import idaapi
import datetime
from pathlib import Path
from typing import Dict, List, Set, Optional, Union, Any

from xrefer.core.helpers import log


class HTMLExporter:
    """
    HTML exporter for XRefer cluster analysis.
    Generates an interactive HTML visualization from XRefer analysis data.
    """
    
    def __init__(self, xrefer_instance):
        """
        Initialize the HTML exporter.
        
        Args:
            xrefer_instance: The XRefer instance containing analysis data
        """
        self.xrefer = xrefer_instance
        self.plugin_dir = Path(os.path.dirname(os.path.realpath(__file__)))
        self.website_dir = self.plugin_dir.parent.parent / "website"
        
    def export(self, output_path: Optional[str] = None) -> str:
        """
        Export the XRefer analysis to an HTML visualization.
        
        Args:
            output_path: Optional path to export to. If None, uses current directory.
            
        Returns:
            str: Path to the exported HTML directory
        """
        log("Starting HTML export...")
        
        # Determine output path
        if output_path is None:
            # Use IDB directory
            idb_path = Path(idaapi.get_input_file_path())
            output_dir = idb_path.parent / f"{idb_path.stem}_xrefer_html"
        else:
            output_dir = Path(output_path)
            
        # Create output directory
        output_dir.mkdir(exist_ok=True)
        log(f"Exporting HTML to: {output_dir}")
        
        # Copy website files
        self._copy_website_files(output_dir)
        
        # Generate JSON data
        json_data = self._generate_json_data()
        
        # Write JSON to file
        data_dir = output_dir / "data"
        data_dir.mkdir(exist_ok=True)
        json_path = data_dir / "xrefer_data.json"
        
        with open(json_path, 'w') as f:
            json.dump(json_data, f, indent=2)
            
        # Update index.html to use the new data file
        self._update_index_html(output_dir, "data/xrefer_data.json")
        
        log(f"HTML export complete. Open {output_dir}/index.html to view.")
        return str(output_dir)
    
    def _copy_website_files(self, target_dir: Path) -> None:
        """
        Copy website files to the output directory.
        
        Args:
            target_dir: Target directory to copy files to
        """
        if not self.website_dir.exists():
            log(f"Website template directory not found: {self.website_dir}")
            raise FileNotFoundError(f"Website template directory not found: {self.website_dir}")
            
        # Copy CSS
        css_dir = target_dir / "css"
        css_dir.mkdir(exist_ok=True)
        for css_file in (self.website_dir / "css").glob("*.css"):
            shutil.copy(css_file, css_dir)
            
        # Copy JS
        js_dir = target_dir / "js"
        js_dir.mkdir(exist_ok=True)
        for js_file in (self.website_dir / "js").glob("*.js"):
            shutil.copy(js_file, js_dir)
            
        # Copy index.html
        shutil.copy(self.website_dir / "index.html", target_dir)
        
    def _update_index_html(self, output_dir: Path, data_path: str) -> None:
        """
        Update the index.html file to use the correct data file.
        
        Args:
            output_dir: Output directory with index.html
            data_path: Path to the data file (relative to index.html)
        """
        index_path = output_dir / "index.html"
        
        with open(index_path, 'r') as f:
            content = f.read()
            
        # Update data path in initialization
        updated_content = content.replace(
            "new XReferVisualization('data/sample_cluster_data.json')",
            f"new XReferVisualization('{data_path}')"
        )
        
        with open(index_path, 'w') as f:
            f.write(updated_content)
    
    def _generate_json_data(self) -> Dict[str, Any]:
        """
        Generate JSON data from XRefer analysis.
        
        Returns:
            Dict: JSON data structure
        """
        # Basic metadata
        metadata = {
            "project": f"XRefer Analysis: {Path(idaapi.get_input_file_path()).name}",
            "version": "1.0",
            "generated_at": datetime.datetime.now().isoformat(),
            "sha256": self.xrefer.settings.get("binary_hash", ""),
            "base_address": hex(idaapi.get_imagebase()),
        }
        
        # If we have LLM data, add binary description
        if hasattr(self.xrefer, "cluster_analysis") and self.xrefer.cluster_analysis:
            if hasattr(self.xrefer.cluster_analysis, "binary_description"):
                metadata["binary_description"] = self.xrefer.cluster_analysis.binary_description
                
            if hasattr(self.xrefer.cluster_analysis, "binary_category"):
                metadata["binary_category"] = self.xrefer.cluster_analysis.binary_category
        
        # Generate clusters
        clusters = []
        
        # Get cluster data
        if self.xrefer.clusters and self.xrefer.clusters.clusters:
            for cluster_id, cluster_obj in self.xrefer.clusters.clusters.items():
                # Skip if this is not a proper cluster
                if not isinstance(cluster_obj, dict) and not hasattr(cluster_obj, 'functions'):
                    continue
                    
                # Get functions in this cluster
                functions = cluster_obj.functions if hasattr(cluster_obj, 'functions') else []
                
                # Create nodes for functions
                nodes = []
                for func_ea in functions:
                    func_name = idaapi.get_func_name(func_ea) or f"sub_{func_ea:X}"
                    
                    # Get calls from this function
                    calls = []
                    for xref in idaapi.get_func_xrefs(idaapi.get_func(func_ea)):
                        if xref.type == idaapi.fl_CN or xref.type == idaapi.fl_CF:
                            calls.append(xref.to)
                    
                    nodes.append({
                        "id": f"F{func_ea:X}",
                        "label": func_name,
                        "description": f"Function at {func_ea:X}",
                        "properties": {
                            "type": "function",
                            "address": f"0x{func_ea:X}",
                            "calls": [f"F{call:X}" for call in calls]
                        }
                    })
                
                # Get edges between functions
                edges = []
                for func_ea in functions:
                    for xref in idaapi.get_func_xrefs(idaapi.get_func(func_ea)):
                        if xref.type == idaapi.fl_CN or xref.type == idaapi.fl_CF:
                            if xref.to in functions:
                                edges.append({
                                    "source": f"F{func_ea:X}",
                                    "target": f"F{xref.to:X}",
                                    "relationship": "calls"
                                })
                
                # Get artifacts for this cluster
                artifacts = {
                    "apis": [],
                    "strings": [],
                    "libraries": [],
                    "capa_matches": []
                }
                
                # Collect artifacts from all functions in this cluster
                for func_ea in functions:
                    if func_ea in self.xrefer.global_xrefs:
                        xrefs = self.xrefer.global_xrefs[func_ea]
                        
                        # Direct xrefs
                        if self.xrefer.DIRECT_XREFS in xrefs:
                            direct = xrefs[self.xrefer.DIRECT_XREFS]
                            
                            # APIs (imports)
                            if 'imports' in direct and direct['imports']:
                                for import_idx in direct['imports']:
                                    if import_idx < len(self.xrefer.entities):
                                        api = self.xrefer.entities[import_idx][1]
                                        if api not in artifacts["apis"]:
                                            artifacts["apis"].append(api)
                            
                            # Strings
                            if 'strings' in direct and direct['strings']:
                                for string_idx in direct['strings']:
                                    if string_idx < len(self.xrefer.entities):
                                        string = self.xrefer.entities[string_idx][1]
                                        if string not in artifacts["strings"]:
                                            artifacts["strings"].append(string)
                            
                            # Libraries
                            if 'libs' in direct and direct['libs']:
                                for lib_idx in direct['libs']:
                                    if lib_idx < len(self.xrefer.entities):
                                        lib = self.xrefer.entities[lib_idx][1]
                                        if lib not in artifacts["libraries"]:
                                            artifacts["libraries"].append(lib)
                            
                            # CAPA
                            if 'capa' in direct and direct['capa']:
                                for capa_idx in direct['capa']:
                                    if capa_idx < len(self.xrefer.entities):
                                        capa = self.xrefer.entities[capa_idx][1]
                                        if capa not in artifacts["capa_matches"]:
                                            artifacts["capa_matches"].append(capa)
                
                # Get cluster name and description from LLM analysis if available
                cluster_name = f"Cluster {cluster_id}"
                cluster_description = f"Functions related to cluster {cluster_id}"
                
                if hasattr(self.xrefer, "cluster_analysis") and self.xrefer.cluster_analysis:
                    if hasattr(self.xrefer.cluster_analysis, "cluster_descriptions"):
                        if cluster_id in self.xrefer.cluster_analysis.cluster_descriptions:
                            desc = self.xrefer.cluster_analysis.cluster_descriptions[cluster_id]
                            if "label" in desc:
                                cluster_name = desc["label"]
                            if "description" in desc:
                                cluster_description = desc["description"]
                
                # Create cluster entry
                cluster_data = {
                    "id": f"cluster.id.{cluster_id}",
                    "name": cluster_name,
                    "description": cluster_description,
                    "subcluster_ids": [],  # For now, no subclusters
                    "nodes": nodes,
                    "edges": edges,
                    "cluster_refs": {},    # For now, no cross-cluster refs
                    "artifacts": artifacts,
                    "api_trace": []        # Would need api trace data
                }
                
                clusters.append(cluster_data)
        
        return {
            "metadata": metadata,
            "clusters": clusters
        }


def export_xrefer_html(xrefer_instance, output_path=None):
    """
    Export XRefer analysis to HTML visualization.
    
    Args:
        xrefer_instance: XRefer instance
        output_path: Optional output path
        
    Returns:
        str: Path to exported HTML
    """
    exporter = HTMLExporter(xrefer_instance)
    return exporter.export(output_path) 