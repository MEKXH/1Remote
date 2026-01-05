import net from 'node:net';

export class IpcClient {
    private pipePath: string;

    constructor(pipeName: string) {
        this.pipePath = `\\\\.\\pipe\\${pipeName}`;
    }

    send(method: string, params?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let buffer = '';

            const client = net.connect(this.pipePath, () => {
                const request = {
                    method,
                    params,
                    id: Math.random().toString(36).substring(7)
                };
                client.write(JSON.stringify(request) + '\n');
            });

            client.on('data', (data) => {
                // Remove BOM if present (C# StreamWriter uses UTF-8 with BOM by default)
                buffer += data.toString().replace(/^\uFEFF/, '');

                // Check if we have a complete line (response ends with newline)
                const newlineIndex = buffer.indexOf('\n');
                if (newlineIndex !== -1) {
                    const jsonStr = buffer.substring(0, newlineIndex).trim();
                    try {
                        const response = JSON.parse(jsonStr);
                        // Backend uses Pascal case (Result, Error), handle both cases
                        const error = response.error || response.Error;
                        const result = response.result ?? response.Result;
                        if (error) {
                            reject(new Error(error));
                        } else {
                            resolve(result);
                        }
                    } catch (e) {
                        reject(e);
                    }
                    client.end();
                }
            });

            client.on('error', (err) => {
                reject(err);
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                client.end();
                reject(new Error('IPC request timeout'));
            }, 5000);
        });
    }
}
