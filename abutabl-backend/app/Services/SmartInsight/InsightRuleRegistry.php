<?php

namespace App\Services\SmartInsight;

use App\Contracts\InsightRuleInterface;

/**
 * Holds the ordered set of production insight rules.
 */
class InsightRuleRegistry
{
    /** @var InsightRuleInterface[] */
    private $rules;

    /**
     * @param  InsightRuleInterface[]  $rules
     */
    public function __construct(array $rules = [])
    {
        $this->rules = array_values($rules);
    }

    /**
     * @return InsightRuleInterface[]
     */
    public function all(): array
    {
        return $this->rules;
    }

    /**
     * @return string[]
     */
    public function ids(): array
    {
        return array_map(function (InsightRuleInterface $rule) {
            return $rule->id();
        }, $this->rules);
    }

    public function has(string $id): bool
    {
        foreach ($this->rules as $rule) {
            if ($rule->id() === $id) {
                return true;
            }
        }

        return false;
    }

    public function get(string $id): ?InsightRuleInterface
    {
        foreach ($this->rules as $rule) {
            if ($rule->id() === $id) {
                return $rule;
            }
        }

        return null;
    }

    public function count(): int
    {
        return count($this->rules);
    }
}
