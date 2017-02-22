# What is this tab for?

This table gives you a detail and accurate view of expeditions.
Expedition scorer also uses the configuration you set in this tab
to figure out some best set of expeditions to be run parallelly for you.

# tl;dr

If this is the first time you run into this page:

- Scroll down to bottom and click `Reset`.
- Congrats, your expedition scorer is now more accurate than before!

otherwise, have fun messing around with these views and sorting methods xD

# What is expedition configuration?

Expedition configuration represents how you normally run expedtions:
for a single expedition, this includes whether you want to guarantee great success,
how many Daihatsu your fleet usually carry
and what fleet composition you use for running the expedition.

- Each expedition is associated with its own configuration.

- For each expedition, a configuration consists of 2 parts:

    - `Income Modifier` is a number applied directly to the basic resource income.
      For example, great success grants you 50% extra resource income, which is equivalent to
      an income modifier of `1.5` (i.e. 150%). Having 4 daihatsu in your fleet will further
      boost the income modifier to `1.8` (`= 1.5 x (1 + 0.05x4) = 1.5 x 1.2`).

        There are two methods of configuring income modifier:

        - `Normal` method allows you to specify whether great success is intended
            and how many Daihatsu you want to carry, and works out the income modifier for you.

        - `Custom` method is for advanced users. You can fill in an income modifier directly
            in case you have Toku Daihatsu or improved Daihatsu and want more accurate results.
            For example, if you want 4 fully improved Daihatsu (122%) together with guaranteed great success (150%),
            Your income modifier will be `1.83` (`=1.22 x 1.5`).

    - `Resupply Cost` is the fuel and ammo cost per run.

        There are two ways of configuring resupply cost:

        - `Normal` method estimates the fuel and ammo cost for you,
          all you need to do is to set `Number of Ships` and `wildcard`.
          Take expedition 5 as an example, for a successful run you would just need 4 ships including
          one light cruiser (`1CL`) and two destroyers (`2DD`). For an almost guaranteed great success rate (about 95%), however,
          you would need 5 sparkled ships in total. and the actual fleet composition would be `1CL4DD`.
          Here the `Number of Ships` is `5` in total,
          and in addition to the require `1CL2DD`, you have two `DD` as `wildcard` ships.

            In case you are interested about how the resupply cost is estimated, see `Cost Model` section.

        - `Custom` method lets you accurately specify the cost:
           say if you have a fleet of 6 Mutsuki-class destroyers for expedition 38 (so it's 80% fuel and 80% ammo consumption),
           you would set both `Fuel` and `Ammo` to `72`. Because one Mutsuki-class destroyer will cost 12 fuel and 12 ammo per run.
           and you have 6 of them in fleet summing up to `72` (`=12x6`) fuel and `72` ammo cost per run.

# I can't see any expeditions

If you are entering this tab for the first time, you need to reset your configuration,
please find `Reset Configuration` section below and pick one resetting method you like.

# I can't change view method or sort expeditions

All these functions are disabled when you are editing expeditions.

# What does `General Config` button do?

Normally expedition table tries to represent your configuration instead of some general numbers.
A `General Config` view forces every expedition configuration to show its actual bonus and resupply cost.

# Resetting

Reseting allows you to initialize your expedition configuration.

There are two resetting methods:

- `Normal` method sets default configuration to all expeditions.
  A default configuration considers basic income as your final income - not aim for great success and no Daihatsu is carried.

- `Recommended` method tries to aim for great success if one expedition has decent income per run.
  For an expedition to be considered decent, its `fuel + ammo + steel + bauxite x 3` value must be no less than `500`.

Optionally you can let KC3 guess some configuration from your recent expedition history.

# What are `Gross Income`, `Net Income` and `Basic Income`?

- `Basic Inome` is the amount of resource you get when you have a normally successful expedition.
- `Gross Income` considers everything: great success, Daihatsu, except resupply cost.
- `Net Income` is `Gross Income` but with resupply cost in mind.

# Why can't I have multiple configuration for a single expedition?

That would mean even more complicated user interface and algorithm to support it.
If you do want to try things like having different amount of Daihatsu for different expeditions,
you can have both this tab and `Expedition Scorer` opened, change configs in this tab and whenever
you click `Calculate` button on `Expedition Scorer`, it always uses your latest configs.

# How can I sort in reversed order?

Clicking on an already-active sorting method reverses the whole list.

# Why switching view methods deactivates the current sorting method?

Because switching view methods, especially between `Total` view and `Hourly` view makes the
current list no longer sorted. On the other hand, if current list is sorted by expedition id
or time, it will be kept.

# What is `Cost Model`?

A cost model is a function that estimates resupply cost given a fleet composition.
You can work out the resupply cost manually by adding up corresponding table cells in `Cost Model` section.

For example, given fleet composition `1CL5DD`, with 80% fuel and ammo cost:

- first look for `CL - 1 Ship` cell, which indicates the cost is 20 fuel and 20 ammo.
- then look for `DD - 5 Ships` cell, which indicates the cost is 60 fuel and 60 ammo.

Therefore `1CL5DD` sums up to a total cost of 80 fuel and 80 ammo.
