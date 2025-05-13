import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { transformToTaxoniumFormat } from '../../utils/taxoniumDataTransformer';
import * as d3 from 'd3';

// Define the prop types for the TaxoniumViewer component
interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  species?: string;
  orthogroup_id?: string;
  [key: string]: any; // For other properties
}

interface TaxoniumViewerProps {
  treeData: TreeNode;
  width?: number;
  height?: number;
  colorBy?: string;
}

// Define type aliases for D3 nodes and links instead of extending interfaces
type D3Node = d3.HierarchyNode<TreeNode>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type D3Link = d3.HierarchyLink<TreeNode>;

/**
 * Simple tree visualization component as a fallback for Taxonium
 */
const TaxoniumViewer: React.FC<TaxoniumViewerProps> = ({ 
  treeData, 
  width = 1000, 
  height = 800,
  colorBy = 'none'
}) => {
  const [processedData, setProcessedData] = useState<TreeNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Process the tree data
  useEffect(() => {
    if (!treeData) return;
    
    try {
      // Just use the original tree data rather than transforming to Taxonium format
      setProcessedData(treeData);
    } catch (error) {
      console.error("Error processing tree data:", error);
    }
  }, [treeData]);
  
  // Render the tree using D3
  useEffect(() => {
    if (!processedData || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content
    
    // Create a hierarchical layout
    const hierarchyData = d3.hierarchy(processedData);
    
    // Tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([height - 100, width - 160])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2));
    
    // Apply the layout
    const root = treeLayout(hierarchyData);
    
    // Create a group element for the entire visualization
    const g = svg.append("g")
      .attr("transform", `translate(80, 50)`);
    
    // Add links between nodes
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d: any) => {
        return `M${d.target.y},${d.target.x}
                C${(d.target.y + d.source.y) / 2},${d.target.x}
                 ${(d.target.y + d.source.y) / 2},${d.source.x}
                 ${d.source.y},${d.source.x}`;
      })
      .attr("fill", "none")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1.5);
    
    // Color function based on colorBy property
    const getColor = (d: D3Node) => {
      if (colorBy === 'species' && d.data.species) {
        // Simple hash function to generate colors based on species
        const hash = d.data.species.split('').reduce((acc: number, char: string) => {
          return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
      } else if (colorBy === 'orthogroup' && d.data.orthogroup_id) {
        // Simple hash function for orthogroup
        const hash = d.data.orthogroup_id.split('').reduce((acc: number, char: string) => {
          return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
      }
      return "#555"; // Default color
    };
    
    // Add nodes
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .on("mouseover", function() {
        d3.select(this).select("circle").transition()
          .duration(200)
          .attr("r", 8);
      })
      .on("mouseout", function() {
        d3.select(this).select("circle").transition()
          .duration(200)
          .attr("r", 5);
      });
    
    // Add circles for nodes
    nodes.append("circle")
      .attr("r", 5)
      .attr("fill", getColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);
    
    // Add labels for nodes
    nodes.append("text")
      .attr("dy", ".31em")
      .attr("x", (d: D3Node) => d.children ? -10 : 10)
      .attr("text-anchor", (d: D3Node) => d.children ? "end" : "start")
      .text((d: D3Node) => d.data.name ? d.data.name.substring(0, 15) : "")
      .style("font-size", "12px")
      .style("font-family", "Arial");
    
  }, [processedData, width, height, colorBy]);
  
  if (!processedData) {
    return <div>Loading tree data...</div>;
  }
  
  return (
    <div style={{ width: `${width}px`, height: `${height}px`, overflow: 'auto' }}>
      <svg ref={svgRef} width={width} height={height}>
        {/* Tree will be rendered here by D3 */}
      </svg>
    </div>
  );
};

export default TaxoniumViewer; 