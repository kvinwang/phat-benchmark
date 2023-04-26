import * as PhalaSdk from "@phala/sdk";
import { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import {
  ContractType,
  ContractFactory,
  RuntimeContext,
  TxHandler,
} from "@devphase/service";
import { Benchmark } from "@/typings/Benchmark";
import { PinkSystem } from "@/typings/PinkSystem";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkUntil(async_fn, timeout) {
  const t0 = new Date().getTime();
  while (true) {
    if (await async_fn()) {
      return;
    }
    const t = new Date().getTime();
    if (t - t0 >= timeout) {
      throw new Error("timeout");
    }
    await sleep(100);
  }
}

describe("APIs should work", () => {
  let benchmarkFactory: Benchmark.Factory;
  let qjsFactory: ContractFactory;
  let system: PinkSystem.Contract;

  let api: ApiPromise;
  let alice: KeyringPair;
  let certAlice: PhalaSdk.CertificateData;
  let currentStack: string;

  before(async function () {
    currentStack = (await RuntimeContext.getSingleton()).paths.currentStack;
    console.log("clusterId:", this.devPhase.mainClusterId);
    console.log(`currentStack: ${currentStack}`);

    benchmarkFactory = await this.devPhase.getFactory("benchmark", {
      contractType: ContractType.InkCode,
    });
    qjsFactory = await this.devPhase.getFactory("qjs", {
      contractType: ContractType.IndeterministicInkCode,
    });

    await qjsFactory.deploy();
    await benchmarkFactory.deploy();

    system = (await this.devPhase.getSystemContract(
      this.devPhase.mainClusterId
    )) as any;

    api = this.api;
    alice = this.devPhase.accounts.alice;
    certAlice = await PhalaSdk.signCertificate({
      api,
      pair: alice,
    });

    await TxHandler.handle(
      system.tx["system::setDriver"](
        { gasLimit: "10000000000000" },
        "JsDelegate",
        qjsFactory.metadata.source.hash
      ),
      alice,
      'system::setDriver("JsDelegate")'
    );

    await checkUntil(async () => {
      const { output } = await system.query["system::getDriver"](
        certAlice,
        {},
        "JsDelegate"
      );
      return output?.asOk?.isSome;
    }, 1000 * 10);
    console.log("Signer:", alice.address.toString());
  });

  describe("Test bench APIs", () => {
    let bench: Benchmark.Contract;
    before(async function () {
      this.timeout(30_000);
      // Deploy contract
      bench = await benchmarkFactory.instantiate("default", [], {
        transferToCluster: 1e12,
      });
      await sleep(3_000);
    });

    it("reply ping", async function () {
      const result = await bench.query.ping(certAlice, {});
      expect(result.output.isOk);
    });

    it("can bench hash", async function () {
      const input = "0x010203";
      const result = await bench.query.benchHash(
        certAlice,
        {},
        input,
        1,
        "Blake2x256" as any
      );
      expect(result.output.toJSON().ok.ok).to.eq(
        "0x11c0e79b71c3976ccd0c02d1310e2516c08edc9d8b6f57ccd680d63a4d8e72da"
      );
    });
    it("can send http", async function () {
      const url = "https://httpbin.org/get?phat=superb";
      const result = await bench.query.httpRequest(
        certAlice,
        {},
        "GET",
        url,
        [],
        "0x"
      );
      expect(result.output.toJSON().ok.ok.reasonPhrase).to.eq("OK");
      const response = JSON.parse(
        hexToString(result.output.toJSON().ok.ok.body as string)
      );
      expect(response.args.phat).to.eq("superb");
    });
    it("can eval js", async function () {
      const result = await bench.query.evalJs(certAlice, {}, '"phat"');
      expect(result.output.toJSON().ok.ok.string).to.eq('phat');
    });
  });
});

function hexToString(hex: string): string {
  let result = "";

  // Remove the "0x" prefix if present.
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }

  // Ensure the hex string has an even number of characters.
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  // Iterate through the hex string, processing two characters at a time.
  for (let i = 0; i < hex.length; i += 2) {
    const hexCode = hex.slice(i, i + 2);
    const charCode = parseInt(hexCode, 16);
    if (isNaN(charCode)) {
      throw new Error("Invalid hex string");
    }
    result += String.fromCharCode(charCode);
  }

  return result;
}
