/**
 * Copyright (C) 2023 Arm Limited
 */

import { SerialMonitorApiV1, SerialMonitorExtension } from '../api/serial-monitor';
import { SerialManager } from './serial-manager';

export class SerialMonitorImpl implements SerialMonitorExtension {
    constructor(
        private readonly serialManager: SerialManager
    ) {}

    public getApi(version: 1): SerialMonitorApiV1;
    public getApi(version: number): unknown {
        if (version === 1) {
            return this.serialManager;
        }

        throw new Error(`No API version ${version} found`);
    }
}
