import { VKConnect, VKConnectSend } from './types/connect';
import { Middleware, MiddlewareAPI } from './types/middleware';

/**
 * Creates the VK Connect enhancer that applies middleware to the `send`
 * method. This is handy for a variety of task such as logging every sent
 * event.
 *
 * @param middlewares The middleware chain to be applied.
 * @returns The VK Connect enhancer applying the middleware.
 */
export function applyMiddleware(
  ...middlewares: Array<Middleware | undefined | null>
): (connect: VKConnect) => VKConnect {
  if (middlewares.includes(undefined) || middlewares.includes(null)) {
    return applyMiddleware(...middlewares.filter((item): item is Middleware => typeof item === 'function'));
  }

  return connect => {
    if (middlewares.length === 0) {
      return connect;
    }

    let send: VKConnectSend = () => {
      throw new Error(
        'Sending events while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this send.'
      );
    };

    const middlewareAPI: MiddlewareAPI = {
      subscribe: connect.subscribe,
      send: (...args) => connect.send(...args)
    };

    const chain = middlewares
      .filter((item): item is Middleware => typeof item === 'function')
      .map(middleware => middleware(middlewareAPI)) //
      .reduce((a, b) => send => a(b(send)));

    send = chain(connect.send);

    return {
      ...connect,
      send
    };
  };
}