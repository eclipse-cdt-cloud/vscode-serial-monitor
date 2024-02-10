/*********************************************************************
 * Copyright (c) 2024 Arm Limited and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/

import * as vscode from 'vscode';
import { DesktopDeviceProvider } from './desktop-device-provider';
import { SerialManager } from '../serial-manager';
import { SerialMonitorExtension } from '../../api/serial-monitor';
import { SerialMonitorImpl } from '../api';

export const activate = async (context: vscode.ExtensionContext): Promise<SerialMonitorExtension> => {
    const deviceProvider = new DesktopDeviceProvider();
    const serialManager = new SerialManager(deviceProvider);

    await serialManager.activate(context);

    // Return the extension API to expose it to other extensions
    return new SerialMonitorImpl(serialManager);
};

export const deactivate = async (): Promise<void> => {
    // Do nothing for now
};
