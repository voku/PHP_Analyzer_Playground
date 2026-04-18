export const examples = [
  {
    name: "Basic dumpType",
    code: `<?php

namespace App;

use function PHPStan\\dumpType;

class User {
    private int $id;
    private string $name;

    public function __construct(int $id, string $name) {
        $this->id = $id;
        $this->name = $name;
    }
}

$user = new User(1, 'Alice');

// PHPStan will report the exact inferred type here:
dumpType($user);
`
  },
  {
    name: "dumpType with Generics",
    code: `<?php

namespace App;

use function PHPStan\\dumpType;

/**
 * @template T
 */
class Collection {
    /** @var array<T> */
    private array $items = [];

    /**
     * @param T $item
     */
    public function add($item): void {
        $this->items[] = $item;
    }

    /**
     * @return T|null
     */
    public function first() {
        return $this->items[0] ?? null;
    }
}

/** @var Collection<string> $stringCollection */
$stringCollection = new Collection();
$stringCollection->add("Hello");

$firstItem = $stringCollection->first();

// See what PHPStan thinks the generic type results to:
dumpType($stringCollection);
dumpType($firstItem);
`
  },
  {
    name: "dumpType with Array Shapes",
    code: `<?php

namespace App;

use function PHPStan\\dumpType;

/**
 * @return array{id: int, title: string, hasPrizes?: bool}
 */
function fetchMovieData(): array {
    return [
        'id' => 42,
        'title' => 'The Matrix',
        'hasPrizes' => true
    ];
}

$movie = fetchMovieData();

dumpType($movie);
dumpType($movie['title']);
`
  },
  {
    name: "Array map with Closures",
    code: `<?php

namespace App;

use function PHPStan\\dumpType;

$numbers = [1, 2, 3, 4, 5];

$squares = array_map(function (int $n): int {
    return $n * $n;
}, $numbers);

// See how PHPStan tracks array mapping return types
dumpType($squares);
`
  }
];
