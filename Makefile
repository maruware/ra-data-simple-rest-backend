test:
	cd $(CURDIR)/packages/auth-koa && yarn test
	cd $(CURDIR)/packages/koa-mongoose && yarn test
	cd $(CURDIR)/packages/koa-sequelize && yarn test