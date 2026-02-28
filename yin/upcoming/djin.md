I'm noticing heavy evolution in agents towards a tree model of conversation. Think of all your AI conversations as a tree that you resume, navigate, prune and link with other conversations. Peeps are saying that static analysis of conversation threads is the way forward - this is why there is so much stealing of workflows and private conversations happening. So, when I say plan, I think of a tree where an agent starts reading at the root and proceeds to read itself into a plan until it reads to the section you want them to work on. At that starting point, you need to check if it's read into the zone correctly, and this check also can be used to improve the path to this point in the tree, if only by inserting todo's on the bits the agent got wrong in checking they are well prompted. They then "do the task" you want them to do, and these are simple things, like expand on what "prune" means say - how to do that. 

The plan is in plain text (markdown files) in a github repo, and any of our agents commit to there. So perfectly safe to let them hallucinate a bit, and get other agents to verify.

I don't know if this is possible, but also committing the conversation that made the changes being committed would be a neat trick and static analysis of the resultant database of convos would give the 6000 a workout.

Will set up a private repo.
