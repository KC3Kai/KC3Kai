# What does this page do?

It lets you input your expedition preferences on which resource type is your priority and AFK hours,
then gives you some best sets of expeditions to run during that time.

Also take a look at `Expedition > Table`, which allows you to configure your expedition preference in more details.

# Does this consider resupply costs?

Yes, it is necessary to consider resupply costs in the calculations to give you the best output. Expeditions that are actually worse may get ranked better just because resupply is not considered when they have much higher costs. [See discussion](https://github.com/dragonjet/KC3Kai/issues/301#issuecomment-132015707).

# Then what do you use as resupply costs?

Basically the scorer will try to use cost-effective ships as much as possible. See [Javran's gist](https://gist.github.com/Javran/07e07ef81638f2b9cec0#file-expedition-minimal-costen-md).

Also the `Cost Model` section of `Expedition > Table` shows you the exact amount of resupply cost used by this scorer.
If you are unsatisfied about the resupply cost, each individual expedition's resupply cost can be customized exactly from `Expeditions` section of `Expedition > Table`.

# Select Expeditions

- Scorer will only take checked expeditions into account. If there is any expedition in the result that you don't want to run,
  simply uncheck that expedition and the click `Calculate` button again.

- There are `Presets` which **overwrites** all your expedition selections. These presets are:

	- `All`: selects all expeditions
	- `Recommended`: some expeditions that have poor resource gains are excluded
	- `Buckets`: all expeditions that might have Buckets (a.k.a. Instant Repair).
	  Note that for some expedition you would need to achieve great success for it to be possible to produce Buckets.
	- `None`: nothing is selected

# How can I input my resource priority?

In `Resource Priority` section, each resource is associated with a value, move sliders to adjust these values. A higher value means higher priority for that resource.
For a given set of expeditions, this value is directly multiplied to the per hour income of that resource
and then values from all 4 resources are added up together to yield the final score for that set of expeditions.

`Reset` button resets all resource priorty to `5`, and `Balanced` button tries to give you a resource priority
that would make all your resources even. [See discussion about `Balanced` here](https://github.com/KC3Kai/KC3Kai/issues/1530#issue-175759666).

# Think carefully about resource priority.

Everyone would have a different play style and game plan, `Balanced` resource priority might not be suitable for you:
if you are leveling ships, you would try to gain more fuel and ammo; if you want to craft planes or radars, more priority on bauxite would be prefered.
You are encouraged to adjust resource priorities to your needs!

# Think carefully about results.

Keep in mind that **first result might not always be the best one**: for example, you might intend for an even amount of fuel and ammo income
and don't care about steel and bauxite, and you would set resource priority to `1` for both fuel and ammo, `0` for both steel and bauxite.
A set of expedition that gives you 400 fuel and 10 ammo per hour (i.e. `400+10=410`) might have a higher score
than another set of expedition that gives you 200 fuel and 200 ammo per hour (i.e. `200+200=400`), while the latter might be more desired.
Therefore, **always take a look at resource per hour columns of the result** before making decisions.

# What if I want more Buckets?

Bucket income is not considered in expedition scorer. However, you can try making good use of `Bucket` preset and `Available Fleets` feature:
for example, you can make two fleets run expeditions only from `Bucket` preset (with available fleet being `2`),
and remaining 1 fleet to focus on other resources you want (with available fleet being `1`).

Alternatively (and probably better), take a look at `Expeditions` section of `Expedition > Table`, sort expeditions by time and prioritize expeditions that
are both short and have Bucket incomes.

# What is the `AFK Time`?

The hours and minutes you're going to be offline, and is also considered in scoring the expeditions: if an expedition time is shorter than your AFK time,
your AFK time will be used to compute that expedition's per hour income.
