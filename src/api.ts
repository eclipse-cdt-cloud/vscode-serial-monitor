/*********************************************************************
 * Copyright (c) 2024 Arm Limited and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/

import { SerialMonitorApiV1, SerialMonitorApiV2, SerialMonitorExtension } from '../api/serial-monitor';
import { SerialManager } from './serial-manager';

export class SerialMonitorImpl implements SerialMonitorExtension {
    constructor(
        private readonly serialManager: SerialManager
    ) {}

    public getApi(version: 1): SerialMonitorApiV1;
    public getApi(version: 2): SerialMonitorApiV2;
    public getApi(version: number): unknown {
        if (version === 1 || version === 2) {
            return this.serialManager;
        }

        throw new Error(`No API version ${version} found`);
    }
}
