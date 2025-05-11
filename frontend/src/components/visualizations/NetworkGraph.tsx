import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Box, Typography, CircularProgress } from '@mui/material';

interface Node {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  properties?: Record<string, any>;
}

interface Edge {
  source: string;
  target: string;
  type?: string;
}

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  loading?: boolean;
  error?: string | null;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, edges, loading, error }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  
  const renderGraph = useCallback(() => {
    if (!svgRef.current) return;
    
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Create SVG element
    const svg = d3.select(svgRef.current);
    
    // Create a group for the graph
    const g = svg.append('g');
    
    // Add zoom and pan behavior
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
    );
    
    // Create a force simulation
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));
    
    // Prepare the data
    const nodeMap: { [key: string]: any } = {};
    const nodeData = nodes.map(node => {
      const d = { ...node };
      nodeMap[node.id] = d;
      return d;
    });
    
    const linkData = edges.map(edge => {
      return {
        source: edge.source,
        target: edge.target,
        type: edge.type || 'Unknown'
      };
    });
    
    // Create links
    const links = g.selectAll('.link')
      .data(linkData)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6);
    
    // Create link labels
    const linkLabels = g.selectAll('.link-label')
      .data(linkData)
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-size', '8px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text((d) => d.type);
    
    // Create node groups
    const nodeGroups = g.selectAll('.node')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, any>()
        .on('start', dragStarted)
        .on('drag', dragging)
        .on('end', dragEnded))
      .on('mouseover', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseout', () => {
        setHoveredNode(null);
      });
    
    // Add node circles
    nodeGroups.append('circle')
      .attr('r', 7)
      .attr('fill', d => getColorByType(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // Add node labels
    nodeGroups.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .attr('font-size', '10px')
      .text(d => truncateLabel(d.label || d.id));
    
    // Define drag behavior functions
    function dragStarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragging(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Update positions on simulation tick
    simulation.nodes(nodeData).on('tick', () => {
      links
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);
      
      linkLabels
        .attr('x', d => ((d.source as any).x + (d.target as any).x) / 2)
        .attr('y', d => ((d.source as any).y + (d.target as any).y) / 2);
      
      nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    simulation.force<d3.ForceLink<any, any>>('link')?.links(linkData);
  }, [nodes, edges, setHoveredNode]);
  
  useEffect(() => {
    if (svgRef.current && nodes && edges && !loading && !error && nodes.length > 0) {
      renderGraph();
    }
    
    // Store ref value to avoid changes during cleanup
    const currentSvgRef = svgRef.current;
    
    return () => {
      // Use the captured ref value for cleanup
      if (currentSvgRef) {
        d3.select(currentSvgRef).selectAll('*').remove();
      }
    };
  }, [nodes, edges, loading, error, renderGraph]);
  
  const getColorByType = (type?: string): string => {
    if (!type) return '#999';
    
    const colorMap: Record<string, string> = {
      'Function': '#1f77b4',
      'MolecularFunction': '#1f77b4',
      'BiologicalProcess': '#2ca02c',
      'CellularComponent': '#d62728',
      'Gene': '#ff7f0e',
      'Protein': '#9467bd',
      'Species': '#8c564b',
      'Taxon': '#e377c2',
      'Organism': '#7f7f7f',
      'Class': '#9467bd',
      'Individual': '#bcbd22',
    };
    
    return colorMap[type] || '#999';
  };
  
  const truncateLabel = (text: string): string => {
    return text.length > 20 ? text.substring(0, 17) + '...' : text;
  };
  
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
        flexDirection="column"
      >
        <Typography variant="h6" color="error" gutterBottom>
          Error loading visualization
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {error}
        </Typography>
      </Box>
    );
  }
  
  if (!nodes || nodes.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
      >
        <Typography variant="body1" color="textSecondary">
          No data to visualize
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: 'grab' }}
      />
      
      {hoveredNode && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'white',
            padding: 2,
            borderRadius: 1,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            maxWidth: '300px',
          }}
        >
          <Typography variant="subtitle2">{hoveredNode.label || hoveredNode.id}</Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            Type: {hoveredNode.type || 'Unknown'}
          </Typography>
          {hoveredNode.properties && Object.keys(hoveredNode.properties).length > 0 && (
            <Box mt={1}>
              {Object.entries(hoveredNode.properties).slice(0, 3).map(([key, value]) => (
                <Typography key={key} variant="caption" display="block">
                  <strong>{key}:</strong> {String(value)}
                </Typography>
              ))}
              {Object.keys(hoveredNode.properties).length > 3 && (
                <Typography variant="caption" color="primary">
                  + {Object.keys(hoveredNode.properties).length - 3} more properties
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default NetworkGraph; 