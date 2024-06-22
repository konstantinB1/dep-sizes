import { Entries, getPackage, showMbOrKb } from './main';
import { WorkerPayload } from './parallel';

export default async function worker() {
    process.on('message', async (message: WorkerPayload<Entries>) => {
        switch (message.type) {
            case 'idle':
                break;
            case 'working':
                for (const [name, { resolved: url }] of message.data!) {
                    const compressed = await getPackage(url);
                    const pretty = showMbOrKb(compressed);

                    process.stdout.write('\x1B[0K');

                    // Write package name and size
                    // Clear from the start of the cursor to the end
                    process.stdout.write('\x1B[0K');
                    process.stdout.write(`${name} - ${pretty}`);

                    // Delete the second line
                    process.stdout.write('\x1B[1A');

                    process.send!({
                        name,
                        rawSize: compressed,
                        formated: pretty,
                    });
                }
                break;
        }
    });
}
