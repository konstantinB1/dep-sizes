import cluster, { type Worker } from 'node:cluster';
import { availableParallelism } from 'node:os';
import { writeFileSync } from 'node:fs';
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

export default function startPool(entries: Entries, args: string[]) {
    const available = availableParallelism();
    const slices = Math.ceil(entries.length / available);
    let processed = 0;
    const done: ProcessedPackage[] = [];
    const workers: Worker[] = [];

    if (cluster.isPrimary) {
        for (let i = 0; i < available; i++) {
            const worker = cluster.fork();

            // Hide cursor
            process.stdout.write('\x1B[?25l');

            worker.on('message', (payload: ProcessedPackage) => {
                processed++;

                // Clear screen
                process.stdout.write('\x1B[0K');

                // GO to the start of the line on first line
                process.stdout.write('\x1B[0G');

                process.stdout.write(
                    `Processing: ${processed}/${entries.length}: ${payload.name} - ${payload.formated} `
                );

                // Delete the second line

                done.push(payload);

                if (processed === entries.length) {
                    process.stdout.write('\n');
                    process.stdout.write('Done fetching packages\n');

                    for (const w of workers) {
                        w.kill();
                    }

                    if (args.includes('--sort')) {
                        const sort = args[args.indexOf('--sort') + 1];

                        if (sort === 'desc') {
                            done.sort((a, b) => b.rawSize - a.rawSize);
                        } else {
                            done.sort((a, b) => a.rawSize - b.rawSize);
                        }
                    }

                    for (const { name, formated } of done) {
                        process.stdout.write(`${name} - ${formated}\n`);
                    }

                    // Show cursor
                    process.stdout.write('\x1B[?25h');

                    if (args.includes('--output')) {
                        const output = args[args.indexOf('--output') + 1];
                        writeFileSync(output, JSON.stringify(done, null, 2), {
                            flag: 'w',
                            flush: true,
                        });
                    }

                    process.exit(0);
                }
            });

            workers.push(worker);

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
