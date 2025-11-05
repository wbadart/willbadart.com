# License Verification

A little script for verifying expiring licenses using
[PyNaCl](https://pynacl.readthedocs.io/en/latest/signing/#example).

```python
import datetime as dt
from nacl.signing import SignedMessage, SigningKey, VerifyKey


def new_license(signer: SigningKey, expires: dt.datetime) -> SignedMessage:
    license_body = expires.isoformat()
    return signer.sign(license_body.encode("latin-1"))


def verify_license(verifier: VerifyKey, license: bytes, now: dt.datetime | None = None) -> bool:
    license_body = verifier.verify(license).decode("latin-1")
    expires = dt.datetime.fromisoformat(license_body)
    now = now if now is not None else dt.datetime.now()
    return now <= expires


def main()
    my_signer = SigningKey.generate()
    my_verifier = my_signer.verify_key
    now = dt.datetime.now()

    good_license = new_license(my_signer, now + dt.timedelta(days=1))
    assert verify_license(my_verifier, good_license)

    bad_license = new_license(my_signer, now + dt.timedelta(days=-1))
    assert not verify_license(my_verifier, bad_license)


if __name__ == "__main__":
    main()
```

## See also

- [Relevant SO post](https://stackoverflow.com/questions/599837/how-to-generate-and-validate-a-software-license-key)
