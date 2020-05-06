# Project TODO List

## Milestone 1 - Single verse look-up

* Initialize Node CLI app.
* Load Bible name/abbreviation to id maps. (Should cache this locally.)
* Load Bible book name/abbreviation to id maps. (Should cache this locally.)
* Parse Bible verse reference.
* Execute API query for verse and print to screen.
* Account for edge cases.
  * references to books with only 1 chapter (e.g. Obadiah, 2 John, 3 John, Jude).
  * 2 letter book abbreviations (i.e. Mt, Mk, Lk, Jn).
