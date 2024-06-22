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

                    // Write package name and size
                    process.stdout.write(`${name} - ${showMbOrKb(compressed)}`);

                    process.send!(compressed);
                }
                break;
        }
    });
}
