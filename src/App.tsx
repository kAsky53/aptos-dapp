import { Types, AptosClient } from 'aptos';
import React from 'react';
import './App.css';

const client = new AptosClient('http://127.0.0.1:8080/v1');

function stringToHex(text: string) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return Array.from(encoded, (i) => i.toString(16).padStart(2, '0')).join('');
}

function App() {
  const [address, setAddress] = React.useState<string | null>(null);

  React.useEffect(() => {
    window.aptos.account().then((data: { address: string }) => setAddress(data.address));
  }, []);

  const [account, setAccount] = React.useState<Types.AccountData | null>(null);
  React.useEffect(() => {
    if (!address) return;
    client.getAccount(address).then(setAccount);
  }, [address]);

  const [modules, setModules] = React.useState<Types.MoveModuleBytecode[]>([]);
  React.useEffect(() => {
    if (!address) return;
    client.getAccountModules(address).then(setModules);
  }, [address]);

  const hasModule = modules.some((m) => m.abi?.name === 'message');
  const publishInstructions = (
    <pre>
      Run this command to publish the module:
      <br />
      aptos move publish --package-dir /path/to/hello_blockchain/ --named-addresses hello_blockchain={address}
    </pre>
  );

  const ref = React.createRef<HTMLTextAreaElement>();
  const [isSaving, setIsSaving] = React.useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!ref.current) return;

    const message = ref.current.value;
    const transaction = {
      type: 'entry_function_payload',
      function: `${address}::message::set_message`,
      arguments: [stringToHex(message)],
      type_arguments: [],
    };

    try {
      setIsSaving(true);
      await window.aptos.signAndSubmitTransaction(transaction);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="App">
      <p>
        <code>{address}</code>
      </p>
      <p>
        <code>{account?.sequence_number}</code>
      </p>
      {hasModule ? (
        <form onSubmit={handleSubmit}>
          <textarea ref={ref} />
          <input disabled={isSaving} type="submit" />
        </form>
      ) : (
        publishInstructions
      )}
    </div>
  );
}

export default App;
