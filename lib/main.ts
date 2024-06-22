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
    const entries = Object.entries(packageLock.packages).slice(
        1
    ) as unknown as Entries;

    startPool(entries, args);
}

main();
