//! A benchmarking contract for various operations.
//!
//! This contract provides benchmarking for the following operations:
//! - Different hashing algorithms
//! - HTTP requests
//! - JavaScript evaluation
//!
//! The contract is intended to be used in a controlled environment and requires authorization.
//! Only the owner or an authorized account can access the contract's benchmarking functions.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

#[ink::contract]
mod benchmark {
    use crate::js;

    use alloc::string::String;
    use alloc::vec::Vec;
    use scale::{Decode, Encode};

    use ink::codegen::Env;
    use ink::storage::Mapping;

    use pink_extension as pink;

    #[ink(storage)]
    pub struct Benchmark {
        owner: AccountId,
        allowed: Mapping<AccountId, ()>,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum HashAlgorithm {
        Sha2x256,
        Keccak256,
        Blake2x256,
        Blake2x128,
    }

    #[derive(Encode, Decode, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        BadOrigin,
        JsError(String),
    }

    type Result<T> = core::result::Result<T, Error>;

    impl Benchmark {
        fn ensure_owner(&self) -> Result<()> {
            if self.env().caller() == self.owner {
                return Ok(());
            }
            Err(Error::BadOrigin)
        }
        fn ensure_allowed(&self) -> Result<()> {
            if self.env().caller() == self.owner {
                return Ok(());
            }
            if self.allowed.contains(&self.env().caller()) {
                return Ok(());
            }
            Err(Error::BadOrigin)
        }
    }

    impl Benchmark {
        /// Constructs a new benchmark contract with the default owner.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self {
                owner: Self::env().caller(),
                allowed: Mapping::new(),
            }
        }

        /// Changes the contract owner.
        #[ink(message)]
        pub fn set_owner(&mut self, owner: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.owner = owner;
            Ok(())
        }

        /// Adds a user to the allowed list.
        #[ink(message)]
        pub fn add_allowed(&mut self, user: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.allowed.insert(user, &());
            Ok(())
        }

        /// Removes a user from the allowed list.
        #[ink(message)]
        pub fn remove_allowed(&mut self, user: AccountId) -> Result<()> {
            self.ensure_owner()?;
            self.allowed.remove(&user);
            Ok(())
        }

        /// Checks if a user is in the allowed list.
        #[ink(message)]
        pub fn is_allowed(&self, user: AccountId) -> bool {
            self.allowed.contains(&user)
        }

        /// A simple ping function to check if the contract is accessible.
        #[ink(message)]
        pub fn ping(&self) -> Result<()> {
            self.ensure_allowed()?;
            Ok(())
        }

        /// Performs a hashing benchmark using the specified algorithm.
        ///
        /// This function will hash the input data `iterations` times using the given algorithm.
        #[ink(message)]
        pub fn bench_hash(
            &self,
            input: Vec<u8>,
            iterations: u32,
            algorithm: HashAlgorithm,
        ) -> Result<Vec<u8>> {
            use ink::env::hash::{Blake2x128, Blake2x256, Keccak256, Sha2x256};

            self.ensure_allowed()?;
            let mut hash = input;
            for _ in 0..iterations {
                match algorithm {
                    HashAlgorithm::Sha2x256 => {
                        hash = Self::env().hash_bytes::<Sha2x256>(&hash).to_vec();
                    }
                    HashAlgorithm::Keccak256 => {
                        hash = Self::env().hash_bytes::<Keccak256>(&hash).to_vec();
                    }
                    HashAlgorithm::Blake2x256 => {
                        hash = Self::env().hash_bytes::<Blake2x256>(&hash).to_vec();
                    }
                    HashAlgorithm::Blake2x128 => {
                        hash = Self::env().hash_bytes::<Blake2x128>(&hash).to_vec();
                    }
                }
            }
            Ok(hash)
        }

        /// Sends an HTTP request with the provided details and returns the response.
        ///
        /// This function uses the `pink_extension` for making HTTP requests.
        #[ink(message)]
        pub fn http_request(
            &self,
            method: String,
            url: String,
            headers: Vec<(String, String)>,
            payload: Vec<u8>,
        ) -> Result<pink::chain_extension::HttpResponse> {
            self.ensure_allowed()?;
            Ok(pink::http_req!(&method, &url, payload, headers))
        }

        /// Evaluates a JavaScript source string and returns the output.
        ///
        /// This function uses the driver `JsDelegate` for executing JavaScript code.
        /// Make sure it was deployed before calling this function.
        #[ink(message)]
        pub fn eval_js(&self, source: String) -> Result<js::Output> {
            self.ensure_allowed()?;
            js::eval(&source, &[]).map_err(Error::JsError)
        }
    }
}

mod js {
    use super::*;

    use alloc::string::String;
    use alloc::vec::Vec;
    use pink_extension as pink;
    use scale::{Decode, Encode};

    #[derive(Debug, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Output {
        String(String),
        Bytes(Vec<u8>),
    }

    pub fn eval(script: &str, args: &[String]) -> Result<Output, String> {
        use ink::env::call;
        let system = pink::system::SystemRef::instance();
        let delegate = system
            .get_driver("JsDelegate".into())
            .ok_or("No JS driver found")?;

        call::build_call::<pink::PinkEnvironment>()
            .call_type(call::DelegateCall::new(delegate.convert_to()))
            .exec_input(
                call::ExecutionInput::new(call::Selector::new(0x49bfcd24_u32.to_be_bytes()))
                    .push_arg(script)
                    .push_arg(args),
            )
            .returns::<ink::MessageResult<Result<Output, String>>>()
            .invoke()
            .unwrap()
    }

    pub trait ConvertTo<To> {
        fn convert_to(&self) -> To;
    }

    impl<F, T> ConvertTo<T> for F
    where
        F: AsRef<[u8; 32]>,
        T: From<[u8; 32]>,
    {
        fn convert_to(&self) -> T {
            (*self.as_ref()).into()
        }
    }
}
