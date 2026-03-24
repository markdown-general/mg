◊ design

Design as intentional bringing-into-being. Pattern recognition and reflection.

```dot
digraph mg {
    rankdir=TB;
    newrank=true;
    graph [overlap=false; splines=spline; nodesep=0.5; ranksep=1.0];
    node [shape=box; style=rounded; margin="0.2,0.1"];
    edge [arrowsize=0.6];
    
    subgraph cluster_meaning {
        label="meaning";
        style=dashed;
        elaborate [label="elaborate"];
        card [label="card"];
        agent [label="agent"];
        semantics [label="semantics"];
        syntax [label="syntax"];
        
        elaborate -> card;
        elaborate -> agent;
        card -> agent [style=dashed];
        agent -> card [style=dashed];
        card -> semantics;
        card -> syntax;
        agent -> semantics;
        agent -> syntax;
    }
    
    subgraph cluster_context {
        label="context";
        style=dashed;
        compose [label="compose"];
        intent [label="intent"];
        encoding [label="encoding"];
        elab [label="elab"];
        flow [label="flow"];
        trace [label="trace"];
        
        compose -> intent;
        compose -> encoding;
        intent -> encoding [style=dashed];
        encoding -> intent [style=dashed];

        encoding -> elab;
        encoding -> flow;
        encoding -> trace;
    }
    
    subgraph cluster_relations {
        label="relations";
        style=dashed;
        collaborate [label="collaborate"];
        multiplicity [label="multiplicity"];
        neutral [label="neutral"];
        structure [label="structure"];
        
        collaborate -> multiplicity;
        collaborate -> neutral;
        multiplicity -> neutral [style=dashed];
        neutral -> multiplicity [style=dashed];
        multiplicity -> structure;
        neutral -> structure;
    }
    
    {rank=same; elaborate; compose; collaborate;}
    elaborate -> compose [dir=both];
    compose -> collaborate [dir=both];
    
    {rank=same; card; agent; intent; encoding; multiplicity; neutral;}
}
```

⊲ See: readme.md for operational frame.
