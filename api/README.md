# Device Manager Extension API

The Device Manager extension exposes an API that other extensions can get hold of:

```typescript
import type { DeviceManagerExtension } from '@arm-debug/vcsode-device-manager';
          
const deviceManagerExtension = vscode.extensions.getExtension<DeviceManagerExtension>('Arm.device-manager');
if (deviceManagerExtension) {
    const deviceManager = await extension.activate();
    const deviceManagerV2 = deviceManager.getApi(2);
    const devices = await deviceManagerV2.getDevices();
}
```
