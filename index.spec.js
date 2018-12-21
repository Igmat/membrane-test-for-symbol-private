const { membrane } = require(".");

console.log('STARTED');

function setup() {
    const leftPriv = Symbol('left private'); // Symbol.private();
    const leftValue = {};
    const Left = {
        base: {
            [leftPriv]: leftValue
        },
        value: leftValue,
        field: leftPriv,
    };


    const rightPriv = Symbol('right private'); // Symbol.private();
    const rightValue = {};
    const Right = {
        base: {
            [rightPriv]: rightValue
        },
        value: rightValue,
        field: rightPriv,
    };

    // graph lives on the "left side"
    const graph = {
        Left,
    };
    // wrappedGraph lives on the "right side"
    const wrappedGraph = membrane(graph);
    wrappedGraph.Right = Right;

    const wrappedLeftSide = wrappedGraph.Left;
    const wrappedRightSide = graph.Right;
    return {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    };
}

console.log('------------------------------------------');

console.log('# set on left side of membrane');
console.log('## set using left side field name');

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bT[fT] = vT;')
    Left.base[Left.field] = Left.value;
    console.assert(wrappedLeftSide.base[wrappedLeftSide.field] === wrappedLeftSide.value);
}

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bT[fT] = vP;')
    Left.base[Left.field] = wrappedRightSide.value;
    console.assert(wrappedLeftSide.base[wrappedLeftSide.field] === Right.value);
}

console.log('## set using right side field name');

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bT[fP] = vT;')
    Left.base[wrappedRightSide.field] = Left.value;
    console.assert(wrappedLeftSide.base[Right.field] === wrappedLeftSide.value);
}

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bT[fP] = vP;')
    Left.base[wrappedRightSide.field] = wrappedRightSide.value;
    console.assert(wrappedLeftSide.base[Right.field] === Right.value);
}

console.log('# set on right side of membrane');
console.log('## set using left side field name');

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bP[fT] = vT;')
    wrappedRightSide.base[Left.field] = Left.value;
    console.assert(Right.base[wrappedLeftSide.field] === wrappedLeftSide.value);
}

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bP[fT] = vP;')
    wrappedRightSide.base[Left.field] = wrappedRightSide.value;
    console.assert(Right.base[wrappedLeftSide.field] === Right.value);
}

console.log('## set using right side field name');

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bP[fP] = vT;')
    wrappedRightSide.base[wrappedRightSide.field] = Left.value;
    console.assert(Right.base[Right.field] === wrappedLeftSide.value);
}

{
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    console.log('### bP[fP] = vP;')
    wrappedRightSide.base[wrappedRightSide.field] = wrappedRightSide.value;
    console.assert(Right.base[Right.field] === Right.value);
}

console.log('PASSED');
