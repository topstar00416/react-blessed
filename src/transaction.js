/**
 * react-blessed Specific React Transaction
 * =========================================
 *
 * React custom reconcile transaction injected by the renderer to enable
 * updates.
 *
 * NOTE: This looks more like a shim than the proper thing actually.
 */
import CallbackQueue from 'react/lib/CallbackQueue';
import PooledClass from 'react/lib/PooledClass';
import Transaction from 'react/lib/Transaction';

import assign from 'object-assign';

function ReactBlessedReconcileTransaction() {
  this.reinitializeTransaction();
  this.reactMountReady = CallbackQueue.getPooled(null);
}

const Mixin = {
  getTransactionWrappers: function() {
    return [];
  },
  getReactMountReady: function() {
    return this.reactMountReady;
  },
  destructor: function() {
    CallbackQueue.release(this.reactMountReady);
    this.reactMountReady = null;
  }
};

assign(
  ReactBlessedReconcileTransaction.prototype,
  Transaction.Mixin,
  Mixin
);

PooledClass.addPoolingTo(ReactBlessedReconcileTransaction);

export default ReactBlessedReconcileTransaction;
