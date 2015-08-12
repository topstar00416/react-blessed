/**
 * React Blessed Component
 * ========================
 *
 * React component abstraction for the blessed library.
 */
import blessed from 'blessed';
import ReactMultiChild from 'react/lib/ReactMultiChild';
import ReactBlessedIDOperations from './ReactBlessedIDOperations';
import invariant from 'invariant';
import update from './update';
import solveClass from './solveClass';
import {extend, startCase} from 'lodash';

/**
 * Renders the given react element with blessed.
 *
 * @constructor ReactBlessedComponent
 * @extends ReactMultiChild
 */
export default class ReactBlessedComponent {
  constructor(tag) {
    this._tag = tag.toLowerCase();
    this._renderedChildren = null;
    this._previousStyle = null;
    this._previousStyleCopy = null;
    this._rootNodeID = null;
    this._wrapperState = null;
    this._topLevelWrapper = null;
    this._nodeWithLegacyProperties = null;
  }

  construct(element) {

    // Setting some properties
    this._currentElement = element;
  }

  /**
   * Mounting the root component.
   *
   * @internal
   * @param  {string} rootID - The root blessed ID for this node.
   * @param  {ReactBlessedReconcileTransaction} transaction
   * @param  {object} context
   */
  mountComponent(rootID, transaction, context) {
    this._rootNodeID = rootID;

    // Mounting blessed node
    const node = this.mountNode(
      ReactBlessedIDOperations.getParent(rootID),
      this._currentElement
    );

    ReactBlessedIDOperations.add(rootID, node);

    // Mounting children
    const childrenToUse = [].concat(this._currentElement.props.children || []);

    this.mountChildren(
      childrenToUse,
      transaction,
      context
    );

    // Rendering the screen
    ReactBlessedIDOperations.screen.debouncedRender();
  }

  /**
   * Mounting the blessed node itself.
   *
   * @param   {BlessedNode|BlessedScreen} parent  - The parent node.
   * @param   {ReactElement}              element - The element to mount.
   * @return  {BlessedNode}                       - The mounted node.
   */
  mountNode(parent, element) {
    const {props, type} = element,
          {children, ...options} = props,
          blessedElement = blessed[type];

    invariant(
      !!blessedElement,
      `Invalid blessed element "${type}".`
    );

    const node = blessed[type](solveClass(options));

    node.onAny((type, ...args) => {
      const handler = this._currentElement.props['on' + startCase(type)];

      if (typeof handler === 'function')
        handler.apply(null, args);
    });

    parent.append(node);

    return node;
  }

  /**
   * Receive a component update.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement}              prevElement
   * @param {ReactElement}              nextElement
   * @param {object}                    context
   * @internal
   * @overridable
   */
  receiveComponent(nextElement, prevElement, transaction, context) {
    const {props: {children, ...options}} = nextElement,
          node = ReactBlessedIDOperations.get(this._rootNodeID);

    update(node, solveClass(options));

    // Updating children
    const childrenToUse = [].concat(children || []);

    this.updateChildren(childrenToUse, transaction, context);

    ReactBlessedIDOperations.screen.debouncedRender();
  }

  /**
   * Dropping the component.
   */
  unmountComponent() {
    this.unmountChildren();

    const parent = ReactBlessedIDOperations.getParent(this._rootNodeID),
          node = ReactBlessedIDOperations.get(this._rootNodeID);

    node.offAny();
    parent.remove(node);

    ReactBlessedIDOperations.drop(this._rootNodeID);

    this._rootNodeID = null;
  }

  /**
   * Getting a public instance of the component for refs.
   *
   * @return {BlessedNode} - The instance's node.
   */
  getPublicInstance() {
    return ReactBlessedIDOperations.get(this._rootNodeID);
  }
}

/**
 * Extending the component with the MultiChild mixin.
 */
extend(
  ReactBlessedComponent.prototype,
  ReactMultiChild.Mixin
);
