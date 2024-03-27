const { DataTypes } = require("sequelize");

const UsersModel = (sequelize) => {
    return sequelize.define('Users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        username: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(64),
            allowNull: true,
            unique: true
        },
        role: {
            type: DataTypes.STRING(64),
            allowNull: false,
            defaultValue: 'user'
        }
    }, {
        tableName: 'Users',
        paranoid: false,
        timestamps: true
    })
}

const StoresModel = (sequelize) => {
    return sequelize.define('Stores', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
        },
        token: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
        },
        shopifyId: {
            type: DataTypes.STRING(64),
            allowNull: true,
            unique: true
        },
        owner: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        ownerEmail: {
            type: DataTypes.STRING(64),
            allowNull: true
        }
    }, {
        tableName: 'Stores',
        paranoid: false,
        timestamps: true
    })
}

const ScheduleModel = (sequelize) => {
    return sequelize.define('Schedule', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        themeId: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        scheduledAt: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        scheduledAtDate: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        scheduledAtTime: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        storeName: {
            type: DataTypes.STRING(64),
            allowNull: true
        },
        themeName: {
            type: DataTypes.STRING(64),
            allowNull: true
        }
    }, {
        tableName: 'Schedule',
        paranoid: false,
        timestamps: true
    })
}

module.exports = {
    UsersModel,
    StoresModel,
    ScheduleModel
};
