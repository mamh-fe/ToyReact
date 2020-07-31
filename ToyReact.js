let childrenSymbol = Symbol("children");
class ElementWrapper {
    constructor(type) {
        // 实dom 设置
        // this.root = document.createElement(type)  
        // 虚dom 设置
        this.type = type;
        this.props = Object.create(null); // 这样设置出来的对象比较干净，没有toString 等
        this[childrenSymbol] = [];
        this.children = [];
    }

    setAttribute(name, value) {
        // 移动到mounTo里边
        // if(name.match(/^on([\s\S]+)$/)) {
        //     console.log('====事件', RegExp.$1, RegExp);
        //     let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase())
        //     this.root.entListener(eventName, value);
        // }
        // if(name === 'className') {
        //     name = 'class';
        // }
        // this.root.setAttribute(name, value)

        // 虚dom改造
        this.props[name] = value;
    }

    // get children() {
    //     return this.children.map(child => child.vdom)
    // }

    appendChild(vchild) {
        // 移动到mounTo 里边
        // let range = document.createRange();
        // if(this.root.children.length) {
        //     range.setStartAfter(this.root.lastChild)
        //     range.setEndAfter(this.root.lastChild)
        // }else {
        //     range.setStart(this.root, 0)
        //     range.setEnd(this.root, 0)
        // }
        // vchild.mountTo(range)
         // 虚dom改造
        this[childrenSymbol].push(vchild);
        this.children.push(vchild.vdom)
    }

    get vdom() {
        // let vChildren = this.children.map(child => child.vdom);
        // return {
        //     type: this.type,
        //     props: this.props,
        //     children: vChildren
        // }
        return this;
    }

    mountTo(range) {
        this.range = range;

        let placeholder = document.createComment('palceholder');
        let endRange = document.createRange();
        endRange.setStart(range.endContainer, range.endOffset);
        endRange.setEnd(range.endContainer, range.endOffset);
        endRange.insertNode(placeholder);

        range.deleteContents();

        let element = document.createElement(this.type);

        for(let name in this.props) {
            let value = this.props[name]

             if(name.match(/^on([\s\S]+)$/)) {
                let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase())
                element.addEventListener(eventName, value);
            }
             if(name === 'className') {
                element.setAttribute('class', value);
            }
            element.setAttribute(name, value)
        }

        for(let child of this.children) {
            console.log('===child', child);
             let range = document.createRange();
            if(element.children.length) {
                range.setStartAfter(element.lastChild)
                range.setEndAfter(element.lastChild)
            }else {
                range.setStart(element, 0)
                range.setEnd(element, 0)
            }
            child.mountTo(range)
        }

        range.insertNode(element)
        // parent.appendChild(this.root)
        // console.log('===parent', parent);
    }
}

export class Component {
    constructor() {
        this.children = [];
        this.props = Object.create(null);
    }
    get type () {
        return this.constructor.name;
    }
    setAttribute(name, value) {
        this.props[name] = value;
        this[name] = value
    }

    mountTo(range) {
        // range.deleteContents(); // 先清空内容

        // let vdom = this.render();
        // vdom.mountTo(range);
        this.range = range;
        this.update();
    }

    update() {
        // let palceholder = document.createComment('placeholder');
        // let range = document.createRange();
        // range.setStart(this.range.endContainer, this.range.endOffset);
        // range.setEnd(this.range.endContainer, this.range.endOffset);
        // range.insertNode(palceholder);
        // this.range.deleteContents();
        
        let vdom = this.vdom;

        if(this.oldVdom) {
            let isSameNode = (node1, node2) => {
                if(node1.type !== node2.type) {
                    return false;
                }
                for(let name in node1.props) {
                    // if(typeof node1.props[name] === 'function' && typeof node2.props[name] === 'function' 
                    // && node1.props[name].toString() === JSON.node2.props[name].toString()) {
                    //     continue;
                    // }
                    if(typeof node1.props[name] === 'object' && typeof node2.props[name] === 'object' 
                    && JSON.stringify(node1.props[name]) === JSON.stringify(node2.props[name])) {
                        continue;
                    }
                    if(node1.props[name] !== node2.props[name]) {
                        return false;
                    }  
                }

                if(Object.keys(node1.props).length !== Object.keys(node2.props).length) {
                    return false;
                }
                return true;
            }

            let isSameTree = (node1, node2) => {
                if(!isSameNode(node1, node2)) {
                    return false;
                }
                if(node1.children.length !== node2.children.length) {
                    return false;
                }
                for(let i = 0; i < node1.children.length; i++) {
                    if(!isSameTree(node1.children[i], node2.children[i] )) {
                        return false;
                    }
                }
                return true;
            }

            let replace = (newTree, oldTree) => {
                console.log('new'+ newTree);
                console.log( 'old'+ oldTree);
                if(isSameTree(newTree, oldTree)) {
                    console.log('====all same');
                    return
                }

                if(!isSameNode(newTree, oldTree)) {
                    console.log('===all different');
                    newTree.mountTo(oldTree.range);
                }else {
                    for (let i = 0; i< newTree.children.length; i++) {
                        replace(newTree.children[i], oldTree.children[i]);
                    }
                }

            }

            console.log('=new',vdom);
            console.log('=old', this.vdom);
            replace(vdom, this.oldVdom, '');

        }else {
            vdom.mountTo(this.range);
        }

        this.oldVdom = vdom;

        // palceholder.parentNode.removeChild(palceholder);
    }

    get vdom() {
        return this.render().vdom;
    }

    appendChild(vchild) {
        this.children.push(vchild)
    }

    setState(state) {
        let merge = (oldState, newState) => {
            for(let p in newState) {
                if(typeof newState[p] === 'object' && newState[p] !== null) {
                    if(typeof oldState[p] !== 'object') {
                        if(newState[p] instanceof Array) {
                            oldState[p] = []
                        }else {
                            oldState[p] ={};
                        }
                    }
                    merge(oldState[p], newState[p])
                }else {
                    oldState[p] = newState[p];
                }
            }
        }
        if(!this.state && state) {
            this.state = {};
        }
        merge(this.state, state);
        this.update();
        console.log('====this.state', this.state);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content)
        this.type = '#text';
        this.children = [];
        this.props = Object.create(null);
    }
    mountTo(range) {
        this.range = range;
        range.deleteContents();
        range.insertNode(this.root)
        // parent.appendChild(this.root)
    }

    get vdom() {
        return this;
        // return {
        //     type: '#text',
        //     props: this.props,
        //     children:[]
        // }
    }
}


export let ToyReact = {
    createElement(type, attributes, ...children) {
        // console.log('=======arguments', type , attributes, ...children);
        // return document.createElement(type);
        // let element = document.createElement(type);
        let element;
        if(typeof type === 'string')  {
            element = new ElementWrapper(type);
        }else {
            element = new type;
        }
        for(let name in attributes) {
            element.setAttribute(name, attributes[name])
            // console.log('=====element-attributes', element,attributes);
        }
        let insertChildren = (children) => {
            for(let child of children) {
                if(typeof child === 'object' && child instanceof Array) {
                    insertChildren(child);
                }else {
                    if(child === null || child === void 0) {
                        child = '';
                    }
                    if(!(child instanceof Component) && !(child instanceof ElementWrapper) && !(child instanceof TextWrapper)) {
                        child = String(child)
                    }
                    if(typeof child === 'string'){
                        child = new TextWrapper(child);
                    }
                    element.appendChild(child)
                }
                // console.log('====child2', child, element);
            }
        }

        insertChildren(children);
        
        return element;
    },
    render(vdom, element) {
        // mountTo 从render 开始一路递归上去
        // console.log('====vdom',  vdom);
        let range = document.createRange();
        if(element.children.length) {
            range.setStartAfter(element.lastChild)
            range.setEndAfter(element.lastChild)
        }else {
            range.setStart(element, 0)
            range.setEnd(element, 0)
        }
        vdom.mountTo(range);
        // element.appendChild(vdom);
    }
}