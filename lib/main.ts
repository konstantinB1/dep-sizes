import packageLock from '../package-lock.json';
import { exec } from 'child_process';
import fs from 'fs/promises';
import cluster from 'cluster';
import startPool from './parallel';

const toKb = (bytes: number) => bytes / 1024;
const toMb = (bytes: number) => toKb(bytes) / 1024;

type PartialPackage = {
    name: string;
    resolved: string;
};

export type Entries = [string, PartialPackage][];

export const getPackage = (url: string) =>
    new Promise<number>((resolve) => {
        exec(
            `curl '${url}' --location --silent  -H 'Accept-Encoding: gzip,deflate' --write-out '%{size_download}' --output /dev/null`,
            (err, stdout) => {
                if (err) {
                    console.error(err);
                    return;
                }

                resolve(Number(stdout.trim()));
            }
        );
    });

export const showMbOrKb = (bytes: number) => {
    if (toMb(bytes) > 1) {
        return `${toMb(bytes).toFixed(2)} MB`;
    }

    return `${toKb(bytes).toFixed(2)} KB`;
};

const args = process.argv.slice(2);

async function main() {
    // process.stdout.write('\x1Bc'); // Clear console

    const startTime = Date.now();
    const toSeconds = (ms: number) => ms / 1000;
    const set = new Set<{
        name: string;
        size: number;
    }>();

    const entries = Object.entries(packageLock.packages).slice(
        1
    ) as unknown as Entries;
    const len = entries.length;
    const processed = 0;
    let interval: NodeJS.Timeout;

    startPool(entries);

    // console.log('Fetching packages...');

    // // Set cursor to line 2
    // process.stdout.write('\x1b[2;0H');

    //     interval = setInterval(() => {
    //         // Reset cursor
    //         process.stdout.write('\x1b[0;0H');
    //         // Move cursor 2 lines below processed
    //         process.stdout.write('\x1b[4B');
    //         // Move to left
    //         process.stdout.write('\x1b[0G');

    //         // Display time elapsed
    //         process.stdout.write(
    //             `Time elapsed: ${toSeconds(Date.now() - startTime).toFixed(0)}s`
    //         );

    //         // Reset cursor
    //         process.stdout.write('\x1b[0;0H');
    //     }, 1000);
    // }

    // clearInterval(interval);

    // // Clear screen
    // process.stdout.write('\x1Bc');

    // // Done in
    // console.log(`Done in: ${toSeconds(Date.now() - startTime).toFixed(0)}s`);

    // // Sort by size
    // const sorted = [...set].sort((a, b) => b.size - a.size);

    // // Display all
    // sorted.forEach(({ name, size }) => {
    //     console.log(`${name}: ${showMbOrKb(size)}`);
    // });

    // // Restore cursor
    // process.stdout.write('\x1B[?25h');

    // if (args.includes('--output')) {
    //     const output = args[args.indexOf('--output') + 1];
    //     await fs.writeFile(output, JSON.stringify(sorted, null, 2));
    // }

    // // Done
    // process.exit(0);
}

main();
