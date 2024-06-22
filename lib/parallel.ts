import cluster, { type Worker } from 'node:cluster';
import { availableParallelism } from 'node:os';
import { Entries } from './main';

type WorkPool = {
    worker: Worker;
    status: 'idle' | 'working' | 'done';
};

type ProcessedPackage = {
    name: string;
    rawSize: number;
    formated: string;
};

export type WorkerPayload<T> = {
    data: T;
    meta: {
        processed: number;
        len: number;
    };
    type: WorkPool['status'];
};

export default function startPool(entries: Entries) {
    const available = availableParallelism();
    const slices = Math.ceil(entries.length / available);
    let processed = 0;

    if (cluster.isPrimary) {
        for (let i = 0; i < available; i++) {
            const worker = cluster.fork();

            process.stdout.write('\x1Bc');
            process.stdout.write('Fetching packages...\n');

            worker.on('message', (payload: ProcessedPackage) => {
                processed++;

                // Move cursor to first line
                process.stdout.write('\x1B[1A');
                // Move cursor to left
                process.stdout.write('\n\x1B[0G\n');
                process.stdout.write(
                    `Processed: ${processed}/${entries.length}:  `
                );

                if (processed === entries.length) {
                    process.stdout.write('\n');
                    process.stdout.write('Done fetching packages\n');
                    worker.kill();
                    process.exit();
                }
            });

            setTimeout(() => {
                worker.send({
                    data: entries.slice(i * slices, (i + 1) * slices),
                    meta: {
                        processed,
                        len: entries.length,
                    },
                    type: 'working',
                } as WorkerPayload<Entries>);
            }, 500);
        }
    } else {
        import('./worker').then((module) => {
            module.default();
        });
    }
}
