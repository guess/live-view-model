import { LiveConnection } from '../connect/LiveConnection.js';
import { LiveChannel } from '../channel/LiveChannel.js';
import { Observable, Subscription } from 'rxjs';

export function liveViewModel(topic: string) {
  // eslint-disable-next-line
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      connection: LiveConnection;
      channel$: Observable<LiveChannel>;
      channelSubscription: Subscription | null = null;

      // eslint-disable-next-line
      constructor(...args: any[]) {
        super(...args);

        // Find the LiveConnection argument
        const connection = args.find((arg) => arg instanceof LiveConnection);

        if (!connection) {
          throw new Error('LiveConnection not provided to the constructor');
        }

        this.connection = connection!;
        this.channel$ = this.connection.createChannel$(topic);
        this.setupChannelConnection();
      }

      setupChannelConnection() {
        this.channelSubscription = this.channel$.subscribe({
          next: (channel) => {
            console.log(`Connected to channel: ${topic}`);
            this.onChannelConnected(channel);
          },
          error: (error) => {
            console.error(`Error connecting to channel ${topic}:`, error);
            this.onChannelError(error);
          },
        });
      }

      onChannelConnected(channel: LiveChannel) {
        // Here you can add any logic that should run when the channel is connected
        // For example, you might want to set up event listeners or send initial messages
      }

      onChannelError(error: any) {
        // Handle channel connection errors
        // You might want to implement retry logic or notify the user
      }

      // Add a method to clean up the subscription when the instance is destroyed
      public destroy() {
        if (this.channelSubscription) {
          this.channelSubscription.unsubscribe();
        }
      }
    };
  };
}
