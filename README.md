# Serial Monitor

Generic serial monitor VS Code extension for reading and writing serial ports on the desktop or on the web (using WebSerial).

## Opening the Serial Monitor view

The **Serial Monitor** view displays the output of a serial port.

### Procedure

Follow these steps to open the view:

1. Use the contributed `Open Serial` command in the command palette to select a serial device (CTRL+SHIFT+P).

1.
   * In desktop environments, select a serial port in the dialog box that displays at the top of the window, and then click **Connect**.

   * In browser environmants, a WebSerial dialog is displayed. Select a serial port in this dialog.

    A drop-down list displays at the top of the window where you can select a baud rate. The baud rate is the data rate in bits per second between your computer and your hardware. To view the output of your hardware correctly, you must select an appropriate baud rate.

1. Select a baud rate.

    The **Serial Monitor** view opens with the baud rate selected.

You can have only one **Serial Monitor** view open for each serial port. Before you open an external serial monitoring program, close the relevant **Serial Monitor** view.

### Next steps

To modify the baud rate, follow these steps:

1. Click **Change active device Serial baud rate** in the status bar and select a baud rate from the drop-down list.

    ![Change active device Serial baud rate icon](images/change_baud_rate.png)

## API USage

It's possible to drive the serial monitor from another extension programmatically. Please refer to [the API file](api/serial-monitor.d.ts) for interfaces and type definitions.

### Example

```typescript
import * as vscode from 'vscode';
import { SerialMonitorExtension } from '@eclipse-cdt-cloud/vscode-serial-monitor';

// Get extension
const extension = vscode.extensions.getExtension('eclipse-cdt.serial-monitor');

if (extension) {
    // Activate extension
    const activated = await extension.activate() as SerialMonitorExtension;

    // Get API
    const api = activated.getApi(1);
    if (api) {
        // Create options object
        const options = { baudRate: 9600 };

        // Create filter (all paramaters are optional)
        const filter = {
            serialNumber: '12345',      // Will select serial port from a specific USB device (desktop only)
            vendorId: device.vendorId,  // can be used to filter the serial selection dialog
            productId: device.productId // can be used to filter the serial selection dialog
        };

        // Open serial (shows serial selection dialog as appropriate)
        const handle = await api.openSerial(filter, options, 'My Serial');

        // Handle can be used later
        await api.revealSerial(handle);
    }
}
```
