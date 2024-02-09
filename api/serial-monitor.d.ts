/**
 * Copyright (C) 2024 Arm Limited
 */

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
