/*********************************************************************
 * Copyright (c) 2024 Arm Limited and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/

export interface SerialFilter {
    serialNumber?: string;
    vendorId?: number;
    productId?: number;
    path?: string;
}

export interface SerialMonitorApiV1 {
    openSerial(portOrFilter?: SerialPort | SerialFilter, options?: SerialOptions, name?: string): Promise<string | undefined>;
    revealSerial(handle: string): Promise<boolean>;
    pauseSerial(handle: string): Promise<boolean>;
    resumeSerial(handle: string): Promise<boolean>;
}

export interface SerialMonitorExtension {
    getApi(version: 1): SerialMonitorApiV1;
}
