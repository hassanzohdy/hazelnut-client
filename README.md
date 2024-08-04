# Hazelnut Browser SDK

This is a simple SDK that allows you to interact with Hazelnut for event and errors tracking.

## Installation

`yarn add @mentoor.io/hazelnut-client`

Or

`npm i @mentoor.io/hazelnut-client`

Or

`pnpm add @mentoor.io/hazelnut-client`

## Configurations

In your entry point of the project, you can initialize the SDK with the following code:

```ts
import { hazelnut } from "@mentoor.io/hazelnut-client";

hazelnut.init({
  apiKey: "YOUR_API_KEY",
  captureUncaughtErrors: true, // default to true
  environment: process.env.NODE_ENV, // default to "production"
  get user() {
    return {
      id: "USER_ID",
      email: "USER_EMAIL",
      // any other user data
    };
  },
});
```

## Usage

Now usage is pretty much straight forward. You can use the SDK to track events and errors.

```ts
import { hazelnut } from "@mentoor.io/hazelnut-client";

hazelnut.track("event_name", {
  // any event data
});
```

By default hazelnut fires a `session.started` `session.ended` and `app.closed` events.

For tracking errors, pass the `Error` instance to the `error` method.

```ts
import { hazelnut } from "@mentoor.io/hazelnut-client";

try {
  // some code that might throw an error
} catch (error: Error) {
  hazelnut.error(error);
}
```

## License

This SDK is licensed under the MIT License.

### TODO

- [ ] Add tests
- [ ] Add more options to control default fired events names