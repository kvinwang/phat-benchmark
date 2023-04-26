import type * as PhalaSdk from "@phala/sdk";
import type * as DevPhase from "@devphase/service";
import type * as DPT from "@devphase/service/etc/typings";
import type { ContractCallResult, ContractQuery } from "@polkadot/api-contract/base/types";
import type { ContractCallOutcome, ContractOptions } from "@polkadot/api-contract/types";
import type { Codec } from "@polkadot/types/types";

export namespace Benchmark {
    type InkPrimitives_Types_AccountId$1 = any;
    type InkPrimitives_LangError$4 = {
        CouldNotReadInput? : null
        };
    type Result$3 = {
        Ok? : never[],
        Err? : InkPrimitives_LangError$4
        };
    type Benchmark_Benchmark_Error$7 = {
        BadOrigin? : null,
        JsError? : string
        };
    type Result$6 = {
        Ok? : never[],
        Err? : Benchmark_Benchmark_Error$7
        };
    type Result$5 = {
        Ok? : Result$6,
        Err? : InkPrimitives_LangError$4
        };
    type Result$8 = {
        Ok? : boolean,
        Err? : InkPrimitives_LangError$4
        };
    type Benchmark_Benchmark_HashAlgorithm$9 = {
        Sha2x256? : null,
        Keccak256? : null,
        Blake2x256? : null,
        Blake2x128? : null
        };
    type Result$11 = {
        Ok? : number[] | string,
        Err? : Benchmark_Benchmark_Error$7
        };
    type Result$10 = {
        Ok? : Result$11,
        Err? : InkPrimitives_LangError$4
        };
    type PinkExtension_ChainExtension_HttpRequest_HttpResponse$15 = { status_code: number, reason_phrase: string, headers: [ string, string ][], body: number[] | string };
    type Result$14 = {
        Ok? : PinkExtension_ChainExtension_HttpRequest_HttpResponse$15,
        Err? : Benchmark_Benchmark_Error$7
        };
    type Result$13 = {
        Ok? : Result$14,
        Err? : InkPrimitives_LangError$4
        };
    type Benchmark_Js_Output$18 = {
        String? : string,
        Bytes? : number[] | string
        };
    type Result$17 = {
        Ok? : Benchmark_Js_Output$18,
        Err? : Benchmark_Benchmark_Error$7
        };
    type Result$16 = {
        Ok? : Result$17,
        Err? : InkPrimitives_LangError$4
        };

    /** */
    /** Queries */
    /** */
    namespace ContractQuery {
        export interface IsAllowed extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, user: InkPrimitives_Types_AccountId$1): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$8>>>;
        }

        export interface Ping extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$5>>>;
        }

        export interface BenchHash extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, input: number[] | string, iterations: number, algorithm: Benchmark_Benchmark_HashAlgorithm$9): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$10>>>;
        }

        export interface HttpRequest extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, method: string, url: string, headers: [ string, string ][], payload: number[] | string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$13>>>;
        }

        export interface EvalJs extends DPT.ContractQuery {
            (certificateData: PhalaSdk.CertificateData, options: ContractOptions, source: string): DPT.CallResult<DPT.CallOutcome<DPT.IJson<Result$16>>>;
        }
    }

    export interface MapMessageQuery extends DPT.MapMessageQuery {
        isAllowed: ContractQuery.IsAllowed;
        ping: ContractQuery.Ping;
        benchHash: ContractQuery.BenchHash;
        httpRequest: ContractQuery.HttpRequest;
        evalJs: ContractQuery.EvalJs;
    }

    /** */
    /** Transactions */
    /** */
    namespace ContractTx {
        export interface SetOwner extends DPT.ContractTx {
            (options: ContractOptions, owner: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }

        export interface AddAllowed extends DPT.ContractTx {
            (options: ContractOptions, user: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }

        export interface RemoveAllowed extends DPT.ContractTx {
            (options: ContractOptions, user: InkPrimitives_Types_AccountId$1): DPT.SubmittableExtrinsic;
        }
    }

    export interface MapMessageTx extends DPT.MapMessageTx {
        setOwner: ContractTx.SetOwner;
        addAllowed: ContractTx.AddAllowed;
        removeAllowed: ContractTx.RemoveAllowed;
    }

    /** */
    /** Contract */
    /** */
    export declare class Contract extends DPT.Contract {
        get query(): MapMessageQuery;
        get tx(): MapMessageTx;
    }

    /** */
    /** Contract factory */
    /** */
    export declare class Factory extends DevPhase.ContractFactory {
        instantiate<T = Contract>(constructor: "default", params: never[], options?: DevPhase.InstantiateOptions): Promise<T>;
    }
}
