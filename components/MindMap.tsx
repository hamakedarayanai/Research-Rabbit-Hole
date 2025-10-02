import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
// FIX: Changed d3 import from namespace to named imports to resolve TypeScript errors with module resolution. This fixes all type and property access errors related to d3.
import {
  select,
  scaleOrdinal,
  schemeCategory10,
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  zoom,
  drag,
  zoomIdentity,
  type Simulation,
  type D3DragEvent,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3';
import type { GraphData, NodeData, LinkData } from '../types';

interface MindMapProps {
  data: GraphData;
}

export interface MindMapHandles {
  exportAsSVG: () => void;
  exportAsPNG: () => void;
}

// FIX: Changed interface definitions to type aliases using intersections to resolve property existence errors.
type D3Node = NodeData & SimulationNodeDatum;
type D3Link = LinkData & SimulationLinkDatum<D3Node>;

const MindMap = forwardRef<MindMapHandles, MindMapProps>(({ data }, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    exportAsSVG: () => {
      if (!svgRef.current) return;
      
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      
      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const viewBox = svgClone.getAttribute('viewBox')?.split(' ').map(Number);
      if (viewBox && viewBox.length === 4) {
          bgRect.setAttribute('x', String(viewBox[0]));
          bgRect.setAttribute('y', String(viewBox[1]));
          bgRect.setAttribute('width', String(viewBox[2]));
          bgRect.setAttribute('height', String(viewBox[3]));
          bgRect.setAttribute('fill', '#1f2937'); // Corresponds to bg-gray-800
          svgClone.insertBefore(bgRect, svgClone.firstChild);
      }
      
      const svgString = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "concept-map.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    exportAsPNG: () => {
      if (!svgRef.current || !containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      
      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const viewBox = svgClone.getAttribute('viewBox')?.split(' ').map(Number);
      if (viewBox && viewBox.length === 4) {
          bgRect.setAttribute('x', String(viewBox[0]));
          bgRect.setAttribute('y', String(viewBox[1]));
          bgRect.setAttribute('width', String(viewBox[2]));
          bgRect.setAttribute('height', String(viewBox[3]));
          bgRect.setAttribute('fill', '#1f2937'); // Corresponds to bg-gray-800
          svgClone.insertBefore(bgRect, svgClone.firstChild);
      }

      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);

          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = "concept-map.png";
          document.body.appendChild(a);
a.click();
          document.body.removeChild(a);
      };

      img.src = url;
    },
  }));

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const { nodes, links } = data;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const d3Nodes: D3Node[] = nodes.map(node => ({ ...node }));
    const d3Links: D3Link[] = links.map(link => ({ ...link }));

    // Create a map for efficient neighbor lookup
    const adjacent = new Map<string, Set<string>>();
    links.forEach(link => {
        if (!adjacent.has(link.source)) adjacent.set(link.source, new Set());
        if (!adjacent.has(link.target)) adjacent.set(link.target, new Set());
        adjacent.get(link.source)!.add(link.target);
        adjacent.get(link.target)!.add(link.source);
    });

    const svg = select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-width / 2, -height / 2, width, height])
        .style('max-width', '100%')
        .style('height', 'auto');

    svg.selectAll("*").remove(); 

    const color = scaleOrdinal(schemeCategory10);

    const simulation = forceSimulation<D3Node>(d3Nodes)
        .force("link", forceLink<D3Node, D3Link>(d3Links).id(d => d.id).distance(150))
        .force("charge", forceManyBody().strength(-400))
        .force("center", forceCenter(0, 0))
        .on("tick", ticked);

    const svgContainer = svg.append("g");

    const link = svgContainer.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(d3Links)
      .join("line")
        .attr("stroke-width", 1.5);

    const linkLabel = svgContainer.append("g")
      .selectAll(".linkLabel")
      .data(d3Links)
      .enter().append("text")
        .attr("class", "linkLabel")
        .attr("fill", "#aaa")
        .style("font-size", "10px")
        .text(d => d.label);

    const node = svgContainer.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll<SVGCircleElement, D3Node>("circle")
      .data(d3Nodes)
      .join("circle")
        .attr("r", 12)
        .attr("fill", d => color(d.group.toString()))
        .call(dragHandler(simulation));

    const nodeLabel = svgContainer.append("g")
      .selectAll(".nodeLabel")
      .data(d3Nodes)
      .enter().append("text")
        .attr("class", "nodeLabel")
        .attr("dx", 16)
        .attr("dy", ".35em")
        .attr("fill", "#fff")
        .style("font-size", "12px")
        .style("text-shadow", "0 1px 0 #000, 1px 0 0 #000, 0 -1px 0 #000, -1px 0 0 #000")
        .text(d => d.label);

    const zoomBehavior = zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
        svgContainer.attr('transform', event.transform);
    });
    svg.call(zoomBehavior);

    node.on('mouseover', (event, d) => {
      const highlightColor = '#22d3ee'; // cyan-400

      const neighbors = adjacent.get(d.id) || new Set<string>();
      const isNeighborNode = (n: D3Node) => n.id === d.id || neighbors.has(n.id);
      const isConnectedLink = (l: D3Link) => (l.source as D3Node).id === d.id || (l.target as D3Node).id === d.id;

      // Enhance hovered node and its neighbors
      node
          .style('opacity', n => isNeighborNode(n) ? 1 : 0.15)
          .attr('stroke', n => n.id === d.id ? highlightColor : (node.select(function(thisNode) { return thisNode === n ? this.getAttribute('stroke') : null}) || '#fff'))
          .attr('stroke-width', n => n.id === d.id ? 2.5 : 1.5);

      nodeLabel
          .style('opacity', n => isNeighborNode(n) ? 1 : 0.15);

      // Highlight connecting links
      link
          .style('stroke-opacity', l => isConnectedLink(l) ? 1 : 0.15)
          .style('stroke', l => isConnectedLink(l) ? highlightColor : '#999');
          
      linkLabel
          .style('opacity', l => isConnectedLink(l) ? 1 : 0.15);

    }).on('mouseout', () => {
        // Reset styles
        node
            .style('opacity', 1)
            .attr('stroke', n => (select(this).attr('data-selected') === 'true' ? '#f59e0b' : '#fff'))
            .attr('stroke-width', n => (select(this).attr('data-selected') === 'true' ? 3 : 1.5));
        nodeLabel
            .style('opacity', 1);
        link
            .style('stroke-opacity', 0.6)
            .style('stroke', '#999');
        linkLabel
            .style('opacity', 1);
    }).on('click', (event, d) => {
        // Center on node
        const transform = zoomIdentity
            .translate(width / 2, height / 2)
            .scale(1.2) // Zoom in a bit
            .translate(-d.x!, -d.y!);
    
        svg.transition().duration(750).call(zoomBehavior.transform, transform);
    
        // Highlight selected node
        node
            .attr('stroke', n => n.id === d.id ? '#f59e0b' : '#fff') // amber-500
            .attr('stroke-width', n => n.id === d.id ? 3 : 1.5)
            .attr('data-selected', n => n.id === d.id ? 'true' : 'false');
    });
        
    function ticked() {
      link
          .attr("x1", d => (d.source as D3Node).x!)
          .attr("y1", d => (d.source as D3Node).y!)
          .attr("x2", d => (d.target as D3Node).x!)
          .attr("y2", d => (d.target as D3Node).y!);

      node
          .attr("cx", d => d.x!)
          .attr("cy", d => d.y!);

      nodeLabel
          .attr("x", d => d.x!)
          .attr("y", d => d.y!);

      linkLabel
          .attr("x", d => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
          .attr("y", d => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2);
    }

    function dragHandler(simulation: Simulation<D3Node, undefined>) {
        function dragstarted(event: D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x!;
            d.fy = d.y!;
        }
        function dragged(event: D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event: D3DragEvent<SVGCircleElement, D3Node, D3Node>, d: D3Node) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        return drag<SVGCircleElement, D3Node>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
      <svg ref={svgRef}></svg>
    </div>
  );
});

export default MindMap;