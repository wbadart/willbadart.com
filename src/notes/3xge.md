# User Table

_Considerations for storing user credentials._

1. Don't store password in plain text
2. Don't store password in _any_ recoverable format (e.g. encrypted) (test:
   should not be able to tell user what their password is)
3. Do store a hash of the password
4. Do add (e.g. append or prepend) "salt" (good-length random bytes) to the
   password before hashing, one salt string per credential (i.e. no system-wide
   salt, use new salt when updating password), stored with credential[^1]
5. Don't user a general-purpose hashing algorithm

   > Warning: Salted hashing (or just hashing) with BLAKE2 or any other
   > general-purpose cryptographic hash function, such as SHA-256, is not
   > suitable for hashing passwords.
   > [...]
   > A good password hashing function must be tunable, slow, and include a
   > salt.
   >
   > - [Python `hashlib`](https://docs.python.org/3/library/hashlib.html#key-derivation)

## Example

```python
import hashlib, hmac, secrets, sqlite3
from dataclasses import dataclass

def init_db(db: sqlite3.Connection):
    db.execute("CREATE TABLE users(username NOT NULL PRIMARY KEY, hash, salt)")

@dataclass(frozen=True)
class UserInput:
    username: str
    password: str

@dataclass(frozen=True)
class SCryptParams:
    cost_factor: int = 2**14  # must be power of 2
    hash_block_size: int = 8
    parallelization_factor: int = 1

def create_user(
    user: UserInput,
    db: sqlite3.Connection,
    hash_params: SCryptParams = SCryptParams(),
) -> None:
    salt = secrets.token_bytes()
    hash_ = _hash(user.password, salt, hash_params)
    with db:
        db.execute(
            "INSERT INTO users(username, hash, salt) values (?, ?, ?)",
            (user.username, hash_, salt),
        )

def authn(
    user: UserInput,
    db: sqlite3.Connection,
    hash_params: SCryptParams = SCryptParams(),
) -> None:
    row = db.execute(
        "SELECT * FROM users WHERE username = ?", (user.username,)
    ).fetchone()
    if row is None:
        raise LookupError(user.username)
    else:
        _db_user, db_hash, db_salt = row
        input_hash = _hash(user.password, db_salt, hash_params)
        return hmac.compare_digest(input_hash, db_hash)

def _hash(password: str, salt: bytes, hash_params) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=hash_params.cost_factor,
        r=hash_params.hash_block_size,
        p=hash_params.parallelization_factor,
    )
```

## Resources

- [PyPI `bcrypt`](https://pypi.org/project/bcrypt/)
  > While bcrypt remains an acceptable choice for password storage, depending
  > on your specific use case you may also want to consider using scrypt
  > (either via [standard library] or [cryptography]) or argon2id via [argon2_cffi].
- [Security StackExchange on scrypt parameters](https://security.stackexchange.com/questions/121870/what-are-the-recommended-scrypt-cost-factors-for-2016)

[standard library]: https://docs.python.org/3/library/hashlib.html#hashlib.scrypt
[cryptography]: https://cryptography.io/en/latest/hazmat/primitives/key-derivation-functions/#cryptography.hazmat.primitives.kdf.scrypt.Scrypt
[argon2_cffi]: https://argon2-cffi.readthedocs.io/

[^1]: "Salt is a cryptographically secure random string that is added to a
    password before it’s hashed, and **the salt should be stored with the
    hash**, making it difficult for an attacker to know the original plaintext
    without having access to both sources."
    [GeeksforGeeks _What is Salted Password Hashing_](https://www.geeksforgeeks.org/what-is-salted-password-hashing/) (emphasis added)
