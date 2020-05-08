# ``api.bible`` Example Requests

[API Reference](https://docs.api.bible/reference#bibles) - Includes code samples.

## Bibles

## Get all English Bibles

```
curl --header 'api-key: xxx' 'https://api.scripture.api.bible/v1/bibles?language=eng'
```

* Will need to map id to name and abbreviation

## Get all books in the KJV

```
curl --header 'api-key: xxx' 'https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-01/books'
```

### Get James 1 in the KJV

* Formatted as plain text, as opposed to JSON or HTML (the default)
* Do not include verse numbers (included by default)
* Get the same chapter in the American Standard Version (ASV, id = 06125adad2d5898a-01) and World English Bible (WEB, id = 06125adad2d5898a-01)

```
curl --header 'api-key: xxx' 'https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-01/chapters/jas.1?content-type=text&include-verse-numbers=false&parallels=06125adad2d5898a-01,9879dbb7cfe39e4d-01'
```

# Get metadata for verses in James 1 in the KJV

```
curl --header 'api-key: xxx'  'https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-01/chapters/jas.1/verses'
```

# Get James 1:2 from the KJV

* Formatted as plain text, as opposed to JSON or HTML (the default)
* Do not include footnotes (included by default)

```
curl --header 'api-key: xxx' 'https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-01/verses/jas.1.2?content-type=text&include-notes=false'
```
